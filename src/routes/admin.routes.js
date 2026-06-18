const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const userRepo = require('../repositories/user.repository');
const taskRepo = require('../repositories/task.repository');
const prisma = require('../config/prisma');

// 1. Semua route admin wajib melewati: Autentikasi (Login) + Otorisasi (Khusus Role ADMIN)
// CATATAN: Di index.js kamu sudah memasang 'authenticate' secara global untuk /api/v1, 
// jadi di sini kita cukup pastikan authorize('ADMIN') berjalan dengan baik.
router.use(authorize('ADMIN'));

// 2. [Langkah 2 & 4] GET /api/v1/admin/users — Lihat semua daftar user
router.get('/users', async (req, res, next) => {
  try {
    const users = await userRepo.findAll();
    res.json({ 
      message: 'Berhasil mendapatkan daftar seluruh user.',
      data: users, 
      total: users.length 
    });
  } catch (err) { 
    next(err); 
  }
});

// 3. [Langkah 5] PATCH /api/v1/admin/users/:id/role — Mengubah role user (USER <=> ADMIN)
router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;

    // Validasi input role agar tidak memasukkan role di luar enum database
    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        error: { 
          code: 'INVALID_ROLE', 
          message: 'Role harus USER atau ADMIN.' 
        }
      });
    }

    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({ 
      message: 'Role berhasil diubah.',
      data: user 
    });
  } catch (err) { 
    next(err); 
  }
});

// 4. GET /api/v1/admin/tasks — Lihat semua task dari seluruh user tanpa terkecuali
router.get('/tasks', async (req, res, next) => {
  try {
    const { data, total } = await taskRepo.findMany({});
    res.json({ data, total });
  } catch (err) { 
    next(err); 
  }
});

module.exports = router;