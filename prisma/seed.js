require('dotenv').config(); // WAJIB DI BARIS 1 BIAR .ENV KE-LOAD DULUAN
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2'); // ← SINKRON: Menggunakan argon2 sesuai auth.service kamu

// Inisialisasi PrismaClient standar (otomatis membaca DATABASE_URL dari .env)
const prisma = new PrismaClient();

// Konfigurasi opsi argon2id disamakan dengan auth.service agar standar enkripsinya seragam
const ARGON2_OPTIONS = {
  memoryCost: 65536, 
  timeCost: 3,       
  parallelism: 4,    
};

async function main() {
  console.log('Mulai seeding database MySQL...');

  // ─── Reset Data Lama ──────────────────────────────────
  // Menghapus data lama dengan urutan terbalik dari relasi untuk menghindari Foreign Key error
  await prisma.reminder.deleteMany(); // Wajib dihapus pertama karena bergantung pada task & user
  await prisma.task.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // ─── Buat Categories ──────────────────────────────────
  const [catBelajar, catKerja, catProyek, catKesehatan, catKeuangan] = await Promise.all([
    prisma.category.create({ data: { name: 'Belajar', color: '#6366F1' } }),
    prisma.category.create({ data: { name: 'Pekerjaan', color: '#F59E0B' } }),
    prisma.category.create({ data: { name: 'Proyek', color: '#10B981' } }),
    prisma.category.create({ data: { name: 'Kesehatan', color: '#EF4444' } }), 
    prisma.category.create({ data: { name: 'Keuangan', color: '#EC4899' } }),  
  ]);
  console.log(' ✓ 5 kategori dibuat');

  // ─── Buat Users (Ditambahkan User Admin sesuai Handbook) ───
  // Mengenkripsi password menggunakan argon2id asli agar bisa diverifikasi saat login
  const hashedPassword = await argon2.hash('password123', ARGON2_OPTIONS);

  const [budi, siti, admin] = await Promise.all([
    prisma.user.create({
      data: { 
        name: 'Budi Santoso', 
        email: 'budi@example.com',
        password: hashedPassword,
        role: 'USER'
      }
    }),
    prisma.user.create({
      data: { 
        name: 'Siti Rahayu', 
        email: 'siti@example.com',
        password: hashedPassword,
        role: 'USER'
      }
    }),
    prisma.user.create({
      data: { 
        name: 'Admin WAD', 
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN' // ← Menambahkan Role Admin
      }
    }),
  ]);
  console.log(' ✓ 3 user dibuat (Budi, Siti, Admin) dengan password ter-hash Argon2');

  // ─── Buat Tasks ───────────────────────────────────────
  const [taskServer, taskAPI, taskMySQL, taskPrisma, taskLaporan, taskDesain] = await Promise.all([
    prisma.task.create({
      data: { 
        title: 'Setup Express server', 
        status: 'DONE',
        priority: 'HIGH', 
        userId: budi.id, 
        categoryId: catProyek.id 
      }
    }),
    prisma.task.create({
      data: { 
        title: 'Belajar REST API', 
        status: 'DONE',
        priority: 'HIGH', 
        userId: budi.id, 
        categoryId: catBelajar.id 
      }
    }),
    prisma.task.create({
      data: { 
        title: 'Setup MySQL + XAMPP', 
        status: 'IN_PROGRESS',
        priority: 'HIGH', 
        userId: budi.id, 
        categoryId: catProyek.id, 
        description: 'Menggunakan Prisma ORM' 
      }
    }),
    prisma.task.create({
      data: { 
        title: 'Belajar Prisma ORM', 
        status: 'TODO',
        priority: 'MEDIUM', 
        userId: budi.id, 
        categoryId: catBelajar.id 
      }
    }),
    prisma.task.create({
      data: { 
        title: 'Review laporan bulanan',
        status: 'TODO',
        priority: 'LOW', 
        userId: siti.id, 
        categoryId: catKerja.id 
      }
    }),
    prisma.task.create({
      data: { 
        title: 'Meeting tim desain', 
        status: 'TODO',
        priority: 'MEDIUM', 
        userId: siti.id, 
        categoryId: catKerja.id 
      }
    }),
  ]);
  console.log(' ✓ 6 task dibuat');

  // ─── Buat Reminders ───────────────────────────────────
  const besok = new Date();
  besok.setDate(besok.getDate() + 1);

  const lusa = new Date();
  lusa.setDate(lusa.getDate() + 2);

  await Promise.all([
    prisma.reminder.create({
      data: {
        message: 'Jangan lupa review arsitektur server Express sebelum deployment!',
        remindAt: besok,
        isSent: false,
        userId: budi.id,
        taskId: taskServer.id
      }
    }),
    prisma.reminder.create({
      data: {
        message: 'Persiapan kuis REST API sebentar lagi dimulai.',
        remindAt: lusa,
        isSent: false,
        userId: budi.id,
        taskId: taskAPI.id
      }
    })
  ]);
  console.log(' ✓ 2 data pengingat (Reminder) berhasil ditambahkan');
  console.log('Seeding selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });