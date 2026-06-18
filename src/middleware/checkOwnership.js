const taskRepo = require('../repositories/task.repository');

/**
 * Middleware untuk memastikan user hanya bisa mengakses task miliknya sendiri.
 * Admin diizinkan mengakses task siapapun (bypass check).
 * Digunakan SETELAH middleware authenticate.
 */
const checkTaskOwnership = async (req, res, next) => {
  try {
    const task = await taskRepo.findById(req.params.id);
    
    // 1. Cek apakah task ada di database (Berlaku untuk Admin & User)
    if (!task) {
      return res.status(404).json({
        error: { 
          code: 'NOT_FOUND', 
          message: 'Task tidak ditemukan.' 
        },
      });
    }

    // 2. Simpan task di req agar controller tidak perlu query ulang (optimasi)
    req.task = task;

    // 3. Admin bypass ownership check — setelah task dipastikan ada dan di-set ke req.task
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // 4. Cek kepemilikan khusus untuk USER biasa: userId task harus sama dengan id dari token
    // Catatan: sesuaikan dengan payload tokenmu, apakah req.user.id atau req.user.userId
    const currentUserId = req.user.id || req.user.userId;
    
    if (task.userId !== currentUserId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Kamu tidak memiliki izin untuk mengakses task ini.',
        },
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { checkTaskOwnership };