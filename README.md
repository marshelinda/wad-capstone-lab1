# WAD Capstone API – Task & Reminder Management System
WAD Capstone API adalah backend service modern untuk sistem manajemen tugas (Task Management) dan pengingat masa depan (Reminder System) yang dibangun menggunakan Node.js, Express.js, dan Prisma ORM menggunakan database MySQL (via XAMPP).
## ✨ Fitur Utama
- **Authentication System**: Implementasi JWT (JSON Web Token) lengkap dengan Access Token & Refresh Token.
- **Advanced Security**: Password hashing menggunakan Argon2id untuk menjaga keamanan kredensial user.
- **Upcoming Reminders**: Fitur untuk menyaring dan mengambil seluruh pengingat (reminder) tugas yang akan datang.
- **Task CRUD System**: Manajemen task lengkap dengan filtering status, limit data, serta offset (pagination).
- **Real-time Notifications**: Dukungan Socket.IO untuk pembaruan task dan pengingat secara real-time.
- **Database Cascade Delete**: Jika sebuah task dihapus, maka seluruh reminder yang terhubung akan otomatis terhapus (On Delete: Cascade).
- **Interactive API Documentation**: Dokumentasi API interaktif menggunakan Swagger UI dengan dukungan Bearer Auth (JWT).
## 🛠️ Stack Teknologi
- **Runtime**: Node.js v18.x / v20.x atau lebih baru
- **Framework**: Express.js
- **Real-time Engine**: Socket.IO
- **ORM**: Prisma ORM
- **Database**: MySQL
- **Security & Auth**: Argon2id & JSON Web Token
- **Documentation**: Swagger UI / OpenAPI 3.0
- **Deployment**: Nginx, PM2
## 🚀 Cara Setup & Instalasi Lokal
1. **Masuk ke Direktori Proyek**
   ```bash
   cd wad-capstone-project
   ```
2. **Install Dependensi**
   ```bash
   npm install
   ```
3. **Konfigurasi Environment (.env)**
   Salin file contoh konfigurasi dan sesuaikan nilainya:
   ```bash
   cp .env.example .env
   ```
   Contoh isi `.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL="mysql://root:password@localhost:3306/wadcapstone"
   ALLOWED_ORIGINS=http://localhost:5173
   JWT_ACCESS_SECRET="super_secret_access_key_123"
   JWT_REFRESH_SECRET="super_secret_refresh_key_123"
   JWT_ACCESS_EXPIRES_IN="15m"
   JWT_REFRESH_EXPIRES_IN="7d"
   ```
4. **Setup & Migrasi Database**
   Pastikan MySQL service berjalan, lalu eksekusi:
   ```bash
   npx prisma migrate dev --name init
   ```
5. **Seeding Data Otomatis**
   ```bash
   node prisma/seed.js
   ```
   Akun default hasil seeding:
   - Email: budi@example.com / siti@example.com
   - Password: password123
6. **Menjalankan Server**
   ```bash
   npm run dev
   ```
   Server berjalan di: `http://localhost:3000`
## 📖 Daftar Endpoint & Event Socket.IO

Dokumentasi API interaktif (Swagger UI) dapat diakses melalui: `http://localhost:3000/api/docs`

### 🔐 1. Autentikasi (`/auth`) – Tanpa Proteksi Token

| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| POST | `/auth/register` | Mendaftarkan user baru |
| POST | `/auth/login` | Login user & generate token |
| POST | `/auth/refresh` | Memperbarui access token |
| POST | `/auth/logout` | Logout & hapus refresh token |

### 📝 2. API V1 – Fitur Utama (`/api/v1`) – Dilindungi JWT

| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| GET | `/api/v1/reminders/upcoming` | Mengambil pengingat masa depan |
| GET | `/api/v1/tasks` | Menampilkan task user + filter & pagination |
| POST | `/api/v1/tasks` | Membuat task baru |
| PUT | `/api/v1/tasks/:id` | Update task berdasarkan ID |
| DELETE | `/api/v1/tasks/:id` | Hapus task berdasarkan ID |
| GET | `/api/v1/users` | Profil user yang sedang login |

### 🔌 3. Event Socket.IO

Sistem ini menggunakan Socket.IO untuk komunikasi real-time dua arah.

| Event Name | Tipe | Deskripsi | Payload / Data |
| --- | --- | --- | --- |
| `connection` | Listener | Client terhubung ke WebSocket server | - |
| `disconnect` | Listener | Client terputus dari server | - |
| `taskCreated` | Emitter | Dikirim ke client saat task baru berhasil dibuat | Objek Task |
| `taskUpdated` | Emitter | Dikirim ke client saat task diperbarui | Objek Task |
| `reminderAlert` | Emitter | Dikirim ke client secara real-time saat waktu pengingat tiba | Objek Reminder |
## 📊 Entity Relationship Diagram (ERD)
```mermaid
erDiagram
    User ||--o{ Task : "has"
    User ||--o{ Reminder : "has"
    User ||--o{ RefreshToken : "has"
    Task ||--o{ Reminder : "triggers"
    Category ||--o{ Task : "categorizes"
```
### Penjelasan Relasi
- **User → Task**: Satu user dapat memiliki banyak task (One-to-Many).
- **User → Reminder**: Satu user dapat memiliki banyak reminder untuk tugas yang berbeda.
- **Task → Reminder**: Setiap reminder wajib terhubung ke satu task. Jika task dihapus, seluruh reminder terkait akan otomatis terhapus (*On Delete: Cascade*).
- **Category → Task**: Satu kategori dapat digunakan oleh banyak task untuk pengelompokan.
- **User → RefreshToken**: Digunakan untuk menyimpan refresh token sebagai bagian dari manajemen sesi autentikasi JWT.
## 🏗️ Arsitektur Deployment & Akses URL

Aplikasi ini disebarkan (*deployed*) ke server produksi (VPS) menggunakan arsitektur berlapis untuk menjamin performa, keamanan, dan ketersediaan tinggi:

### 🔗 Tautan Akses & Health Check Produksi
Layanan backend ini dapat diakses dan dipantau statusnya melalui URL publik maupun port IP eksternal berikut:
* **Health Check API (Domain):** [https://api-health.marshelinda.my.id](https://api-health.marshelinda.my.id)
* **Health Check API (IP Server HTTP):** [http://103.93.135.78:3000/api/health](http://103.93.135.78:3000/api/health)
```text
[ Pengguna / Browser / Klien Frontend ]
          │ (HTTPS / HTTP - Port 3000)
          ▼
    ┌───────────┐
    │   Nginx   │ ── (Reverse Proxy & SSL Termination)
    └───────────┘
          │ (HTTP Proxying - Port 3000 & 3001)
          ▼
    ┌───────────┐
    │    PM2    │ ── (Process Manager - Keep Alive & Clustering)
    └───────────┘
          │
          ├──► [ Frontend App (Vite Static / SSR Server) ] ── (Port 3001)
          │
          └──► [ Backend Express.js Server ] ─────────────── (Port 3000)
                     │
                     ├──► [ Socket.IO Server Instance ]
                     │
                     └──► [ Prisma ORM Layer ]
                                │
                                ▼
                          ┌───────────┐
                          │   MySQL   │ ── (Database Layer via XAMPP/Native)
                          └───────────┘
```
1. **Nginx (Reverse Proxy)**: Menerima request HTTP/HTTPS dan koneksi WebSocket dari internet (Client). Nginx bertugas meneruskan traffic dengan aman ke port aplikasi Node.js internal, mengelola sertifikat SSL (HTTPS), dan melakukan load balancing jika diperlukan.
2. **PM2 (Process Manager)**: Menjalankan aplikasi Express.js di background (daemon). PM2 memastikan aplikasi tetap hidup dan akan melakukan auto-restart jika aplikasi mengalami crash. PM2 juga dapat menjalankan aplikasi dalam mode cluster untuk mendistribusikan beban kerja ke beberapa core CPU.
3. **Node.js App (Express.js + Socket.IO)**: Inti dari backend yang memproses logika bisnis, API routing, keamanan JWT, koneksi database, dan memancarkan event real-time menggunakan Socket.IO.
4. **MySQL DB**: Menyimpan seluruh data relasional yang diakses oleh Node.js menggunakan Prisma ORM.
## 📁 Struktur Folder Proyek
```text
📂 wad-capstone-project/
├── 📂 Media/                  # Bukti visual & dokumentasi proyek
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
```
