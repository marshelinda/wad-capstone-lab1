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
  // 1. Error dengan statusCode bawaan dari authService / custom error status
  const status = err.statusCode || err.status || 500;
  
  if (err.statusCode || err.status) {
    return res.status(status).json({
      error: {
        code: err.code || 'AUTH_ERROR',
        message: err.message
      },
    });
  }

  // 2. Prisma P2002: Unique constraint failed (misal: email duplikat)
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: 'Data sudah digunakan.'
      },
    });
  }

  // 3. Fallback error jika terjadi masalah tidak terduga lainnya
  console.error('Unhandled error:', err);
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: config.env === 'development' ? err.message : 'Terjadi kesalahan di server.',
    },
  });
});

// ─── Start Server ────────────────────────────────────────────
// PENTING: Menggunakan server.listen(), BUKAN app.listen() agar Socket.IO berjalan
server.listen(config.port, () => {
  console.log('─'.repeat(50));
  console.log(` ${config.appName} v${config.version}`);
  console.log(` Environment : ${config.env}`);
  console.log(` Database    : MySQL via XAMPP`);
  console.log(` Server      : http://localhost:${config.port}`);
  console.log(` Docs        : http://localhost:${config.port}/api/docs`);
  console.log(` Socket.IO   : Siap menerima koneksi websocket`);
  console.log('─'.repeat(50));
});

module.exports = app;