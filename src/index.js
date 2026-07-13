const config = require('./config');
const express = require('express');
const http = require('http'); // ← BARU: Mengimpor HTTP module bawaan Node.js
const { Server } = require('socket.io'); // ← BARU: Mengimpor Socket.IO Server
const helmet = require('helmet');
const cors = require('cors');
const { corsOptions } = require('./config/cors'); // ← BARU: Menggunakan konfigurasi CORS terpusat
const routes = require('./routes');
const tasksRoutes = require('./routes/tasks.routes');
const usersRoutes = require('./routes/users.routes');
const adminRoutes = require('./routes/admin.routes');
const reminderRoutes = require('./routes/reminderRoutes');
const authRoutes = require('./routes/auth.routes');
const authenticate = require('./middleware/authenticate');
const setupSwagger = require('./docs/swagger');
const { apiLimiter } = require('./config/rateLimiter');

// Import PrismaClient untuk keperluan Background Worker Reminder
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app); // ← BARU: HTTP server membungkus Express untuk Socket.IO

// ─── SOCKET.IO SERVER ────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: config.allowedOrigins || "http://localhost:5173", // Menggunakan allowedOrigins dari config
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Ekspos io agar bisa diakses dari controller menggunakan req.app.get('io')
app.set("io", io);

// ─── Middleware Global ───────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions)); // Menggunakan corsOptions baru yang lebih dinamis
app.use(express.json({ limit: "10kb" })); // Menambahkan limit payload untuk keamanan tambahan
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

// Logging middleware untuk memantau request yang masuk beserta durasinya
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ─── Routes (Tanpa Proteksi) ─────────────────────────────────
app.use('/', routes); // /health
app.use('/api', routes); // /api/info, /api/echo/:msg
app.use('/auth', authRoutes);

// ─── API Routes (Dilindungi JWT) ─────────────────────────────
app.use('/api/v1', authenticate); // Middleware JWT tetap mengamankan rute di bawahnya
app.use('/api/v1/tasks', tasksRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/reminders', reminderRoutes);

// ─── SOCKET.IO SETUP ─────────────────────────────────────────
require("./socket")(io); // Memuat file handler socket.js milikmu

// ─── BACKGROUND WORKER: REAL-TIME PUSH REMINDER (USER SPECIFIC) ───
const checkAndSendReminders = async (ioInstance) => {
  try {
    const sekarang = new Date();
    
    // 1. Ambil pengingat yang jatuh tempo beserta data userId-nya
    const jatuhTempoReminders = await prisma.reminder.findMany({
      where: {
        remindAt: {
          lte: sekarang
        }
      },
      include: {
        task: {
          select: { title: true }
        }
      }
    });

    if (jatuhTempoReminders.length > 0) {
      console.log(`[Cron] Menemukan ${jatuhTempoReminders.length} reminder jatuh tempo.`);

      jatuhTempoReminders.forEach((reminder) => {
        // 🎯 PERBAIKAN: Kirim HANYA ke room milik userId yang bersangkutan
        // Catatan: Pastikan di file socket.js milikmu sudah ada perintah `socket.join(String(user.id))` atau `socket.join(`user:${user.id}`)` saat user pertama kali connect.
        
        const targetRoom = String(reminder.userId); 
        
        ioInstance.to(targetRoom).to(`user:${reminder.userId}`).emit('push-notification', {
          title: '⏰ Pengingat Tugas!',
          message: `Waktunya menyelesaikan tugas: "${reminder.task?.title || 'Tugas Tanpa Judul'}"`,
          taskId: reminder.taskId
        });
      });

      // 3. Hapus pengingat yang sudah dikirim dari database
      const idsToDelete = jatuhTempoReminders.map(r => r.id);
      await prisma.reminder.deleteMany({
        where: {
          id: { in: idsToDelete }
        }
      });
      console.log(`[Cron] Berhasil membersihkan ${idsToDelete.length} data reminder.`);
    }
  } catch (error) {
    console.error('[Cron Error] Gagal memproses data jatuh tempo:', error);
  }
};

// Menjalankan pengecekan otomatis database setiap 15 detik sekali
setInterval(() => {
  checkAndSendReminders(io);
}, 15000);

// ─── Swagger UI ─────────────────────────────────────────────
setupSwagger(app);

// ─── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} tidak ditemukan.`,
      hint: 'Kunjungi GET /api/docs untuk dokumentasi API.',
    },
  });
});

// ─── Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  
  if (err.statusCode || err.status) {
    return res.status(status).json({
      error: {
        code: err.code || 'AUTH_ERROR',
        message: err.message
      },
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: 'Data sudah digunakan.'
      },
    });
  }

  console.error('Unhandled error:', err);
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: config.env === 'development' ? err.message : 'Terjadi kesalahan di server.',
    },
  });
});

// ─── Start Server ────────────────────────────────────────────
server.listen(config.port, () => {
  console.log('─'.repeat(50));
  console.log(` ${config.appName} v${config.version}`);
  console.log(` Environment : ${config.env}`);
  console.log(` Database    : MySQL via XAMPP`);
  console.log(` Server      : http://localhost:${config.port}`);
  console.log(` Docs        : http://localhost:${config.port}/api/docs`);
  console.log(` Socket.IO   : Siap menerima koneksi websocket`);
  console.log('🚀 Background Worker Reminder Real-time telah aktif!');
  console.log('─'.repeat(50));
});

module.exports = app;