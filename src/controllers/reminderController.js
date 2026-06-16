const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getUpcomingReminders = async (req, res) => {
  try {
    // Mengambil id user dari payload token JWT yang sedang login
    const userId = req.user.id; 
    const sekarang = new Date();

    const upcomingReminders = await prisma.reminder.findMany({
      where: {
        userId: userId,
        remindAt: {
          gt: sekarang // 'gt' (greater than) = mencari waktu yang lebih besar dari sekarang (belum terlewat)
        }
      },
      include: {
        task: {
          select: {
            title: true,
            status: true
          }
        }
      },
      orderBy: {
        remindAt: 'asc' // Diurutkan dari waktu pengingat yang paling dekat
      }
    });

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil daftar pengingat mendatang',
      data: upcomingReminders
    });
  } catch (error) {
    console.error('Error getUpcomingReminders:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server internal'
    });
  }
};

module.exports = {
  getUpcomingReminders
};