const jwt = require("jsonwebtoken");
const config = require("./config");

module.exports = function setupSocket(io) {
  // ── AUTH MIDDLEWARE ─────────────────────────────────────
  // Berjalan sebelum setiap koneksi diterima
  io.use((socket, next) => {
    try {
      // Ambil token dari auth object yang dikirim klien
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Token tidak disertakan"));
      }

      // Verifikasi JWT menggunakan secret yang sama dengan REST API
      const payload = jwt.verify(token, config.jwt?.accessSecret || config.jwtAccessSecret);

      // Simpan data user di socket agar bisa diakses di handler
      socket.data.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };

      next(); // lanjutkan — koneksi diterima
    } catch (err) {
      // Token tidak valid atau expired
      next(new Error("Token tidak valid: " + err.message));
    }
  });

  // ── CONNECTION HANDLER ──────────────────────────────────
  io.on("connection", (socket) => {
    const { userId, email, role } = socket.data.user;
    console.log(`[Socket] User ${email} (${userId}) terhubung — socket: ${socket.id}`);

    // Masukkan socket ke room privat (untuk notifikasi personal)
    socket.join(`user:${userId}`);

    // Masukkan socket ke room global task (untuk update task semua user)
    socket.join("tasks:global");

    // Broadcast jumlah user online ke semua client
    const onlineCount = io.sockets.sockets.size;
    io.emit("users:online", { count: onlineCount });

    // ── DISCONNECT ────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(`[Socket] User ${email} terputus — reason: ${reason}`);
      
      // Update jumlah online setelah disconnect
      const remaining = io.sockets.sockets.size;
      io.emit("users:online", { count: remaining });
    });

    // ── PING (health check dari klien) ────────────────────
    socket.on("ping", (cb) => {
      if (typeof cb === "function") cb("pong");
    });
  });
};