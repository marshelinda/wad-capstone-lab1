const { PrismaClient } = require('@prisma/client');

// Singleton Pattern: Memastikan hanya ada 1 instance Prisma Client yang berjalan.
// Ini sangat penting untuk mencegah terjadinya eror "Too many connections" pada MySQL XAMPP.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error'] // Di mode dev: semua query SQL akan kelihatan di terminal
    : ['warn', 'error'],                 // Di mode prod: hanya log error yang dimunculkan
});

// Otomatis memutuskan koneksi database dengan aman jika aplikasi Express dimatikan
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;