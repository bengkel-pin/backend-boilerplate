# IndahJaya Bangunan — Backend API

REST API untuk sistem dashboard admin IndahJaya Bangunan. Dibangun dengan Node.js, Express, Prisma ORM, dan PostgreSQL.

---

## Teknologi

- **Runtime:** Node.js v20.x
- **Framework:** Express v5
- **ORM:** Prisma v5
- **Database:** PostgreSQL
- **Auth:** JWT (Access Token + Refresh Token)
- **Upload:** Multer

---

## Prasyarat

- Node.js >= 20.15
- PostgreSQL (lokal atau cloud)
- npm

---

## Instalasi

```bash
# 1. Clone repo dan masuk ke folder backend
cd backend

# 2. Install dependencies
npm install

# 3. Salin file env
cp .env.example .env
```

Edit `.env` dan sesuaikan dengan konfigurasi database kamu:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/indahjayabangunan?schema=public"
JWT_SECRET=ganti_dengan_string_random_yang_kuat
JWT_REFRESH_SECRET=ganti_dengan_string_random_yang_kuat
```

```bash
# 4. Generate Prisma client
npm run db:generate

# 5. Jalankan migrasi database
npm run db:migrate

# 6. Seed data admin awal
npm run db:seed

# 7. Jalankan server
npm run dev
```

Server berjalan di `http://localhost:5000`

---

## Akun Default (setelah seed)

| Email | Password | Role |
|-------|----------|------|
| admin@indahjayabangunan.com | admin123 | ADMIN |

> Segera ganti password setelah login pertama.

---

## Struktur Folder

```
backend/
├── prisma/
│   ├── schema.prisma       # Skema database
│   └── seed.js             # Data awal
├── src/
│   ├── config/
│   │   └── database.js     # Prisma client
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── mediaController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   ├── auth.js         # JWT authenticate & authorize
│   │   ├── errorHandler.js
│   │   └── upload.js       # Multer config
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── mediaRoutes.js
│   │   └── dashboardRoutes.js
│   └── utils/
│       ├── jwt.js
│       └── response.js
├── uploads/
│   ├── images/
│   └── documents/
├── .env
├── .env.example
├── server.js
└── package.json
```

---

## API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/login` | Login dan dapatkan token | — |
| POST | `/refresh-token` | Perbarui access token | — |
| GET | `/me` | Ambil data profil sendiri | ✓ |
| PUT | `/change-password` | Ganti password | ✓ |

**Contoh login:**
```json
POST /api/auth/login
{
  "email": "admin@indahjayabangunan.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": { "id": "...", "name": "Administrator", "role": "ADMIN" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### User — `/api/users`

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/` | Daftar semua user | ADMIN, MANAGER |
| GET | `/:id` | Detail user | ADMIN, MANAGER |
| POST | `/` | Buat user baru | ADMIN |
| PUT | `/:id` | Update user | ADMIN |
| DELETE | `/:id` | Hapus user | ADMIN |

**Query params GET `/`:** `?page=1&limit=10&search=nama&role=STAFF`

---

### Media — `/api/media`

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/` | Daftar media | ✓ |
| POST | `/upload` | Upload file | ✓ |
| DELETE | `/:id` | Hapus media | ADMIN, MANAGER |

**Upload file:**
```
POST /api/media/upload
Content-Type: multipart/form-data
Body: file (field name: "file")
```

Format yang didukung: JPG, PNG, WEBP, PDF, DOC, DOCX. Maks 5MB.

**Query params GET `/`:** `?page=1&limit=20&type=image` atau `?type=document`

---

### Dashboard — `/api/dashboard`

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/stats` | Statistik ringkasan | ADMIN, MANAGER |
| GET | `/activity-logs` | Log aktivitas | ADMIN, MANAGER |

---

## Roles & Permission

| Aksi | ADMIN | MANAGER | STAFF |
|------|-------|---------|-------|
| Lihat user | ✓ | ✓ | — |
| Buat/edit/hapus user | ✓ | — | — |
| Upload media | ✓ | ✓ | ✓ |
| Hapus media | ✓ | ✓ | — |
| Lihat dashboard & statistik | ✓ | ✓ | — |

---

## Format Response

Semua response menggunakan format standar:

```json
{
  "success": true,
  "message": "Pesan deskriptif",
  "data": { }
}
```

Response dengan paginasi:
```json
{
  "success": true,
  "message": "...",
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

## Scripts

```bash
npm run dev          # Jalankan server development (nodemon)
npm run start        # Jalankan server production
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Jalankan migrasi database
npm run db:push      # Push schema tanpa migrasi (development)
npm run db:studio    # Buka Prisma Studio (GUI database)
npm run db:seed      # Seed data awal
```

---

## Variabel Environment

| Variabel | Wajib | Deskripsi |
|----------|-------|-----------|
| `DATABASE_URL` | ✓ | Connection string PostgreSQL |
| `JWT_SECRET` | ✓ | Secret key untuk access token |
| `JWT_REFRESH_SECRET` | ✓ | Secret key untuk refresh token |
| `JWT_EXPIRES_IN` | — | Masa berlaku access token (default: `7d`) |
| `JWT_REFRESH_EXPIRES_IN` | — | Masa berlaku refresh token (default: `30d`) |
| `PORT` | — | Port server (default: `5000`) |
| `NODE_ENV` | — | Environment (`development` / `production`) |
| `FRONTEND_URL` | — | URL frontend untuk CORS (default: `*`) |
| `MAX_FILE_SIZE` | — | Maks ukuran file upload dalam bytes (default: `5242880`) |
