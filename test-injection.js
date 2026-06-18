const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function demo() {
  console.log('=== MEMULAI DEMO SQL INJECTION ===\n');

  // Input berbahaya yang biasanya dimasukkan hacker di kolom login/search
  const maliciousEmail = "' OR '1'='1";
  console.log(`Input Penyerang: ${maliciousEmail}\n`);

  // --------------------------------------------------------------------
  // ✗ Skenario Rentan (Analisis Teoretis)
  // --------------------------------------------------------------------
  console.log('--- Skenario RENTAN (Jika menggunakan Raw Query Unsafe) ---');
  console.log('Query akan menjadi: SELECT * FROM users WHERE email = \'\' OR \'1\'=\'1\'');
  console.log('Efeknya: Kondisi 1=1 selalu BENAR. Hacker bisa bypass login tanpa password dan melihat SEMUA data user!\n');

  // --------------------------------------------------------------------
  // ✓ Skenario AMAN (Menggunakan Fitur Bawaan Prisma)
  // --------------------------------------------------------------------
  console.log('--- Skenario AMAN (Menggunakan Prisma ORM Method) ---');
  console.log('Mengecek ke database menggunakan prisma.user.findUnique()...');

  try {
    const user = await prisma.user.findUnique({
      where: { email: maliciousEmail }
    });

    // Menampilkan hasil pembuktian
    console.log('Hasil dari database:', user); 
    
    if (user === null) {
      console.log('\n[AMAN] Hasilnya NULL! Prisma memperlakukan input hacker sebagai teks string biasa.');
      console.log('[SUKSES] SQL Injection GAGAL total berkat Parameterized Query otomatis dari Prisma!');
    } else {
      console.log('\n[BAHAYA] Data berhasil ditembus!');
    }

  } catch (error) {
    console.error('Terjadi error saat query:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

demo();