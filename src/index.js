const config = require('./config');
const express = require('express');
const routes = require('./routes');
const tasksRoutes = require('./routes/tasks.routes');
const usersRoutes = require('./routes/users.routes'); // ← BARU: Mengimpor rute user
const setupSwagger = require('./docs/swagger');

const app = express();

// ─── Middleware Global ───────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware untuk memantau request yang masuk beserta durasinya
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ─── Routes ─────────────────────────────────────────────────
app.use('/', routes); // /health
app.use('/api', routes); // /api/info, /api/echo/:msg 
app.use('/api/v1/tasks', tasksRoutes); // /api/v1/tasks (CRUD)
app.use('/api/v1/users', usersRoutes); // ← BARU: Mendaftarkan rute /api/v1/users

// ─── Swagger UI ─────────────────────────────────────────────
setupSwagger(app);

// ─── 404 & Error Handlers ───────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} tidak ditemukan.`,
      hint: 'Kunjungi GET /api/docs untuk dokumentasi API.',
    },
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
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
  console.log(` Database    : MySQL via XAMPP`); // ← BARU: Info database terupdate
  console.log(` Server      : http://localhost:${config.port}`);
  console.log(` Docs        : http://localhost:${config.port}/api/docs`);
  console.log('─'.repeat(50));
});

module.exports = app;