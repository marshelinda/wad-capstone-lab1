const prisma = require('../config/prisma');

const refreshTokenRepo = {
  // Simpan refresh token baru ke database
  async create({ token, userId, expiresAt }) {
    return prisma.refreshToken.create({
      data: { 
        token, 
        userId, 
        expiresAt: new Date(expiresAt) 
      },
    });
  },

  // Cari refresh token yang valid (belum di-revoke dan belum expired)
  async findValid(token) {
    return prisma.refreshToken.findFirst({
      where: {
        token,
        isRevoked: false,
        expiresAt: { gt: new Date() }, // gt = greater than (belum expired)
      },
      include: { 
        user: { 
          select: { id: true, email: true, name: true } 
        } 
      },
    });
  },

  // Cari token (termasuk yang sudah di-revoke — untuk reuse detection)
  async findByToken(token) {
    return prisma.refreshToken.findUnique({ 
      where: { token } 
    });
  },

  // Revoke satu token (saat di-rotate)
  async revoke(token) {
    return prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  },

  // Revoke SEMUA token milik user (untuk reuse detection / logout semua device)
  async revokeAllByUser(userId) {
    return prisma.refreshToken.updateMany({
      where: { 
        userId: Number(userId), 
        isRevoked: false 
      },
      data: { isRevoked: true },
    });
  },

  // Hapus token expired dari DB (bisa dijalankan sebagai cron job)
  async deleteExpired() {
    return prisma.refreshToken.deleteMany({
      where: { 
        expiresAt: { lt: new Date() } // lt = less than
      },
    });
  },
};

module.exports = refreshTokenRepo;