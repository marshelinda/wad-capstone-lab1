const jwt = require('jsonwebtoken');
const config = require('../config');

const authenticate = (req, res, next) => {
  // 1. Ambil token dari header Authorization
  const authHeader = req.headers['authorization'];
  
  // Format yang diharapkan: 'Bearer eyJhbGci...'
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'MISSING_TOKEN',
        message: 'Access token diperlukan. Sertakan header: Authorization: Bearer <token>',
      },
    });
  }

  const token = authHeader.split(' ')[1]; // Ambil bagian setelah 'Bearer '

  try {
    // 2. Verifikasi signature dan expiry
    const payload = jwt.verify(token, config.jwt.accessSecret);

    // 3. Tambahkan informasi user (termasuk ROLE) ke request untuk digunakan controller/middleware otorisasi
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role, // ← UPDATE: Menambahkan role dari payload token sesuai handbook
    };

    next();
  } catch (err) {
    // jwt.verify melempar error jika token invalid atau expired
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token sudah expired. Gunakan refresh token untuk memperbarui.',
        },
      });
    }

    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Access token tidak valid.',
      },
    });
  }
};

module.exports = authenticate;