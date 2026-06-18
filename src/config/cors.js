// File: src/config/cors.js
const config = require('./index');

// Membaca daftar domain yang diizinkan dari .env, atau gunakan default localhost (Vite + backend)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3001'];

const corsOptions = {
  origin: (origin, callback) => {
    // 1. Izinkan request tanpa origin (seperti Postman, curl, mobile apps, atau server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    // 2. Cek apakah origin frontend termasuk dalam daftar yang diizinkan
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin '${origin}' tidak diizinkan oleh CORS.`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Wajib bernilai true jika frontend mengirimkan cookie / credentials session
  maxAge: 86400,     // Cache response preflight (OPTIONS) selama 24 jam untuk menghemat bandwidth
};

module.exports = corsOptions;