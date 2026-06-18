/**
 * Middleware factory untuk otorisasi berbasis role (RBAC).
 * Digunakan SETELAH middleware authenticate.
 *
 * @param {...string} roles - Role yang diizinkan (e.g., 'ADMIN', 'USER')
 * @returns Express middleware
 *
 * Penggunaan:
 * router.delete('/:id', authenticate, authorize('ADMIN'), ctrl.deleteUser);
 * router.get('/me', authenticate, authorize('USER', 'ADMIN'), ctrl.me);
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // 1. Pastikan authenticate sudah berjalan sebelum authorize (req.user harus ada)
    if (!req.user) {
      return res.status(401).json({
        error: { 
          code: 'UNAUTHENTICATED', 
          message: 'Autentikasi diperlukan.' 
        },
      });
    }

    // 2. Cek apakah role user termasuk dalam daftar role yang diizinkan
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Akses ditolak. Diperlukan role: ${roles.join(' atau ')}.`,
        },
      });
    }

    next();
  };
};

module.exports = authorize;