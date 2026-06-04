const prisma = require('../config/prisma');

const userRepository = {
  // ─── Mengambil Semua User ───────────────────────────────
  async findAll() {
    return prisma.user.findMany({
      select: { 
        id: true, 
        name: true, 
        email: true, 
        createdAt: true 
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // ─── Mencari User Berdasarkan ID ────────────────────────
  async findById(id) {
    return prisma.user.findUnique({
      where: { id: Number(id) },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        createdAt: true 
      },
    });
  },

  // ─── Mencari User Berdasarkan Email ─────────────────────
  // Digunakan untuk validasi registrasi atau proses login nanti
  async findByEmail(email) {
    return prisma.user.findUnique({ 
      where: { email } 
    });
  },
};

module.exports = userRepository;