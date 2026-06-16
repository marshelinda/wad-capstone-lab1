# 🚀 WAD Capstone API – Task & Reminder Management System

WAD Capstone API adalah backend service modern untuk sistem manajemen tugas (*Task Management*) dan pengingat masa depan (*Reminder System*) yang dibangun menggunakan **Node.js**, **Express.js**, dan **Prisma ORM** menggunakan database **MySQL (via XAMPP)**.

---

## ✨ Fitur Utama

- **Authentication System**  
  Implementasi JWT (JSON Web Token) lengkap dengan Access Token & Refresh Token.

- **Advanced Security**  
  Password hashing menggunakan **Argon2id** untuk menjaga keamanan kredensial user.

- **Feature Mandiri UTS – Upcoming Reminders**  
  Fitur khusus untuk menyaring dan mengambil seluruh pengingat (*reminder*) tugas yang akan datang.

- **Task CRUD System**  
  Manajemen task lengkap dengan filtering status, limit data, serta offset (pagination).

- **Database Cascade Delete**  
  Jika sebuah task dihapus, maka seluruh reminder yang terhubung akan otomatis terhapus (*On Delete: Cascade*).

- **Interactive API Documentation**  
  Dokumentasi API interaktif menggunakan **Swagger UI** dengan dukungan Bearer Auth (JWT).

---

## 🛠️ Stack Teknologi

- **Runtime**: Node.js v18.x / v20.x atau lebih baru  
- **Framework**: Express.js  
- **ORM**: Prisma ORM  
- **Database**: MySQL (via XAMPP Control Panel)  
- **Security & Auth**: Argon2id & JSON Web Token  
- **Documentation**: Swagger UI / OpenAPI 3.0  

---

## 🚀 Cara Setup & Instalasi

### 1. Masuk ke Direktori Proyek

    cd wad-capstone-project

---

### 2. Install Dependensi

    npm install

---

### 3. Konfigurasi Environment (.env)

    PORT=3000
    NODE_ENV=development

    DATABASE_URL="mysql://root:@localhost:3306/wadcapstone"

    JWT_ACCESS_SECRET="super_secret_access_key_123"
    JWT_REFRESH_SECRET="super_secret_refresh_key_123"
    JWT_ACCESS_EXPIRES_IN="15m"
    JWT_REFRESH_EXPIRES_IN="7d"

---

### 4. Setup & Migrasi Database

Pastikan **MySQL pada XAMPP Control Panel dalam kondisi START**, lalu jalankan:

    npx prisma migrate dev --name init

---

### 5. Seeding Data Otomatis

    node prisma/seed.js

Akun default hasil seeding:
- Email: `budi@example.com`
- Email: `siti@example.com`
- Password: `password123`

---

### 6. Menjalankan Server

    npm run dev

Server berjalan di:

    http://localhost:3000

---

## 📊 Entity Relationship Diagram (ERD)

Struktur database dirancang menggunakan **Relational Database** dengan hubungan antar entitas sebagai berikut:

    [User] (1)
       │
       │
       ├────────────── (N) [Task] (N) ──────────────┐
       │                                             │
       │                                             │
       ├────────────── (N) [Reminder] ◄─────────────┘
       │                     (On Delete: Cascade)
       │
       └────────────── (N) [RefreshToken]


    [Category] (1) ─────────────── (N) [Task]

---

### Penjelasan Relasi ERD

- **User → Task**  
  Satu user dapat memiliki banyak task (*One-to-Many*).

- **User → Reminder**  
  Satu user dapat memiliki banyak reminder untuk tugas yang berbeda.

- **Task → Reminder**  
  Setiap reminder wajib terhubung ke satu task.  
  Jika task dihapus, seluruh reminder terkait akan otomatis terhapus (*On Delete: Cascade*).

- **Category → Task**  
  Satu kategori dapat digunakan oleh banyak task untuk pengelompokan.

- **User → RefreshToken**  
  Digunakan untuk menyimpan refresh token sebagai bagian dari manajemen sesi autentikasi JWT.

---

## 📖 Dokumentasi API (Swagger UI)

Dokumentasi API interaktif dapat diakses melalui:

    http://localhost:3000/api/docs

---

## 🚀 Endpoint Utama

### 🔐 1. Autentikasi (/auth) – Tanpa Proteksi Token

| Method | Endpoint | Deskripsi |
|------|---------|----------|
| POST | /auth/register | Mendaftarkan user baru |
| POST | /auth/login | Login user & generate token |
| POST | /auth/refresh | Memperbarui access token |
| POST | /auth/logout | Logout & hapus refresh token |

---

### 📝 2. API V1 – Fitur Utama (/api/v1) – Dilindungi JWT

| Method | Endpoint | Deskripsi | 
|------|---------|-----------|
| GET | /api/v1/reminders/upcoming | Mengambil pengingat masa depan | 
| GET | /api/v1/tasks | Menampilkan task user + filter & pagination | 
| POST | /api/v1/tasks | Membuat task baru | 
| PUT | /api/v1/tasks/:id | Update task berdasarkan ID |
| DELETE | /api/v1/tasks/:id | Hapus task berdasarkan ID | 
| GET | /api/v1/users | Profil user yang sedang login | 

---

## 🏗️ Struktur Folder Proyek

    📂 WAD-CAPSTONE/
    ├── 📂 Media/                  # Bukti visual & dokumentasi UTS
    │   ├── database-table-reminder.png
    │   ├── database-table-task.png
    │   ├── swagger-endpoints.png
    │   └── swagger-models.png
    ├── 📂 prisma/                 # Prisma migrations, schema, & seeding
    │   ├── 📂 migrations/
    │   ├── schema.prisma
    │   └── seed.js
    ├── 📂 src/                    # Source code utama aplikasi
    │   ├── 📂 config/             # Konfigurasi database/Prisma Client
    │   ├── 📂 controllers/        # Logika penanganan request (Controller)
    │   ├── 📂 data/               # Data statis / lokal utility
    │   ├── 📂 docs/               # Konfigurasi generator Swagger UI
    │   ├── 📂 middleware/         # Middleware JWT Auth & Joi Validation
    │   ├── 📂 repositories/       # Abstraksi database / query data layer
    │   ├── 📂 routes/             # Berkas routing modular terproteksi
    │   ├── 📂 services/           # Business logic layer
    │   ├── 📂 validators/         # Skema validasi input (Joi payload)
    │   └── index.js               # Entry point utama server Express.js
    ├── 📄 .env                    # Environment local configuration
    ├── 📄 .env.example            # Template konfigurasi environment
    ├── 📄 .gitignore              # Daftar file yang diabaikan oleh Git
    ├── 📄 package-lock.json       # Catatan dependensi versi spesifik
    ├── 📄 package.json            # Script manager & dependensi npm
    ├── 📄 prisma.config.ts        # Konfigurasi tambahan ekosistem Prisma
    └── 📄 WAD-Capstone.postman_collection  # Berkas koleksi ekspor Postman
---

## 📄 Lisensi

Project ini dikembangkan untuk memenuhi **Ujian Tengah Semester (UTS)**  
mata kuliah **Web Advanced Development**.

---