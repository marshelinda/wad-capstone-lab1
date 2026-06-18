const config = require('./config');
const express = require('express');
const helmet = require('helmet');                         // ← BARU: Mengimpor Helmet untuk keamanan headers
const routes = require('./routes');
const tasksRoutes = require('./routes/tasks.routes');
const usersRoutes = require('./routes/users.routes'); 
const adminRoutes = require('./routes/admin.routes');       // ← Mengimpor rute admin RBAC
const reminderRoutes = require('./routes/reminderRoutes');  // ← Mengimpor rute reminder UTS
const authRoutes = require('./routes/auth.routes');         // ← Mengimpor rute auth
const authenticate = require('./middleware/authenticate'); // ← Mengimpor middleware JWT
const setupSwagger = require('./docs/swagger');

// Import apiLimiter global dari file config rateLimiter kamu
const { apiLimiter } = require('./config/rateLimiter');

const app = express();

// ─── Middleware Global ───────────────────────────────────────
app.use(helmet());                                          // ← BARU: Mengaktifkan tameng pengaman Helmet Headers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pasang apiLimiter secara global agar Express mulai menghitung request IP
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
app.use('/auth', authRoutes); // ← Rute login, register, refresh, logout (Di dalamnya ada authLimiter)

// ─── API Routes (Dilindungi JWT) ─────────────────────────────
// Middleware 'authenticate' dipasang di sini agar semua rute di bawah /api/v1 wajib membawa token
app.use('/api/v1', authenticate);
app.use('/api/v1/tasks', tasksRoutes);       // /api/v1/tasks (CRUD yang terproteksi)
app.use('/api/v1/users', usersRoutes);       // /api/v1/users (Terproteksi)
app.use('/api/v1/admin', adminRoutes);       // /api/v1/admin (← Jalur Admin RBAC Terproteksi)
app.use('/api/v1/reminders', reminderRoutes); // /api/v1/reminders/upcoming (Terproteksi)

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
  // 1. Error dengan statusCode bawaan dari authService
  if (err.statusCode) {
    return res.status(err.statusCode).json({
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
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: config.env === 'development' ? err.message : 'Terjadi kesalahan di server.',
    },
  });
});

// ─── Start Server ────────────────────────────────────────────
app.listen(config.port, () => {
  console.log('─'.repeat(50));
  console.log(` ${config.appName} v${config.version}`);
  console.log(` Environment : ${config.env}`);
  console.log(` Database    : MySQL via XAMPP`); 
  console.log(` Server      : http://localhost:${config.port}`);
  console.log(` Docs        : http://localhost:${config.port}/api/docs`);
  console.log('─'.repeat(50));
});

module.exports = app;