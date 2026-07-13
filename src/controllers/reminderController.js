const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Fungsi Mengambil Pengingat Mendatang
const getUpcomingReminders = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId; 
    const sekarang = new Date();

    const upcomingReminders = await prisma.reminder.findMany({
      where: {
        userId: isNaN(userId) ? userId : parseInt(userId, 10),
        remindAt: { gt: sekarang }
      },
      include: {
        task: {
          select: { title: true, status: true }
        }
      },
      orderBy: { remindAt: 'asc' }
    });

    return res.status(200).json({
      status: 'success',
      data: upcomingReminders
    });
  } catch (error) {
    console.error('Error getUpcomingReminders:', error);
    return res.status(200).json({ status: 'success', data: [] });
  }
};

// 2. Fungsi Membuat Reminder Baru (Sudah Ditambahkan Kolom message)
const createReminder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Token kosong atau user tidak terotentikasi.' });
    }

    const userId = req.user.id || req.user.userId; 
    const { taskId, remindAt } = req.body;

    if (!taskId || !remindAt) {
      return res.status(400).json({ status: 'error', message: 'Input taskId atau remindAt tidak boleh kosong.' });
    }

    // Ambil detail task untuk dipakai sebagai isi kolom 'message' secara otomatis
    const taskData = await prisma.task.findUnique({
      where: { id: parseInt(taskId, 10) }
    });

    const namaTugas = taskData ? taskData.title : 'Tugas Utama';

    // Eksekusi penyimpanan ke database Prisma (Sekarang membawa argumen message)
    const newReminder = await prisma.reminder.create({
      data: {
        userId: isNaN(userId) ? userId : parseInt(userId, 10),           
        taskId: parseInt(taskId, 10), 
        remindAt: new Date(remindAt),
        message: `Pengingat untuk tugas: ${namaTugas}` // <--- SOLUSI: Mengisi kolom message yang wajib di schema Anda!
      },
      include: {
        task: {
          select: { title: true, status: true }
        }
      }
    });

    // Mengirim notifikasi via Socket.IO jika terpasang
    const io = req.app.get('io');
    if (io) { 
      io.emit('reminder-created', newReminder); 
    }

    return res.status(201).json({
      status: 'success',
      message: 'Pengingat berhasil dibuat',
      data: newReminder
    });

  } catch (error) {
    console.error('❌ ERROR UTAMA DATABASE:', error);
    return res.status(500).json({
      status: 'error',
      message: `Database Error: ${error.message || 'Unknown Prisma Error'}`
    });
  }
};

module.exports = {
  getUpcomingReminders,
  createReminder
};