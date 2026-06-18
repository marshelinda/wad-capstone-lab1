// File: src/config/rateLimiter.js
const rateLimit = require('express-rate-limit');

// 1. Limiter Umum: Berlaku untuk semua endpoint API standar
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Durasi: 15 menit
  max: 100,                 // Batas maksimal: 100 request per IP dalam rentang windowMs
  standardHeaders: true,    // Mengembalikan info rate limit di header `RateLimit-*`
  legacyHeaders: false,     // Menonaktifkan header lama `X-RateLimit-*`
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Terlalu banyak request dari IP ini. Coba lagi dalam 15 menit.',
    },
  },
});

// 2. Limiter Ketat: Khusus endpoint autentikasi seperti Login (Anti Brute-Force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Durasi: 15 menit
  max: 5,                   // Batas maksimal: Hanya 5 percobaan gagal per 15 menit
  skipSuccessfulRequests: true, // Jika login berhasil, tidak akan dihitung sebagai kegagalan
  message: {
    error: {
      code: 'TOO_MANY_ATTEMPTS',
      message: 'Terlalu banyak percobaan login. Tunggu 15 menit.',
    },
  },
});

// 3. Limiter Sensitif: Untuk endpoint krusial lainnya (seperti register atau refresh token)
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // Durasi: 1 jam
  max: 20,                  // Batas maksimal: 20 request per jam
  message: {
    error: { 
      code: 'TOO_MANY_REQUESTS', 
      message: 'Batas request tercapai.' 
    },
  },
});

module.exports = { apiLimiter, authLimiter, sensitiveLimiter };