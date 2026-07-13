const jwt = require("jsonwebtoken");
const config = require("./config");

// Fungsi tiruan untuk simulasi query database (sesuaikan dengan ORM/DB Anda)
async function getJatuhTempoRemindersFromDB() {
  // Contoh logis query: SELECT * FROM reminders WHERE waktu_reminder <= NOW() AND is_sent = false
  // Return array of objects: [{ id: 1, user_id: 12, judul_tugas: "Tugas UTS" }]
  return []; 
}

async function updateReminderStatusInDB(reminderId) {
  // Contoh logis query: UPDATE reminders SET is_sent = true WHERE id = reminderId
}

module.exports = function setupSocket(io) {
  // ── AUTH MIDDLEWARE ─────────────────────────────────────
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Token tidak disertakan"));
      }

      const payload = jwt.verify(token, config.jwt?.accessSecret || config.jwtAccessSecret);

      socket.data.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };

      next();
    } catch (err) {
      next(new Error("Token tidak valid: " + err.message));
    }
  });

  // ── CONNECTION HANDLER ──────────────────────────────────
  io.on("connection", (socket) => {
    const { userId, email, role } = socket.data.user;
    console.log(`[Socket] User ${email} (${userId}) terhubung — socket: ${socket.id}`);

    socket.join(`user:${userId}`);
    socket.join("tasks:global");

    const onlineCount = io.sockets.sockets.size;
    io.emit("users:online", { count: onlineCount });

    // ── DISCONNECT ────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(`[Socket] User ${email} terputus — reason: ${reason}`);
      const remaining = io.sockets.sockets.size;
      io.emit("users:online", { count: remaining });
    });

    // ── PING ──────────────────────────────────────────────
    socket.on("ping", (cb) => {
      if (typeof cb === "function") cb("pong");
    });
  });

  // ── REMINDER PUSH SCHEDULER ─────────────────────────────
  // Mengecek database setiap 1 menit (60000 ms) untuk reminder yang jatuh tempo
  setInterval(async () => {
    try {
      const activeReminders = await getJatuhTempoRemindersFromDB();

      for (const reminder of activeReminders) {
        // Kirim push notification ke room user spesifik terkait
        io.to(`user:${reminder.user_id}`).emit("notification", {
          title: "⏰ Pengingat Tugas!",
          message: `Reminder: ${reminder.judul_tugas} sudah jatuh tempo.`,
          type: "reminder",
          data: reminder
        });

        // Tandai di database agar tidak dikirim ulang pada interval berikutnya
        await updateReminderStatusInDB(reminder.id);
      }
    } catch (error) {
      console.error("[Socket Error] Gagal memproses interval reminder:", error);
    }
  }, 60000);
};