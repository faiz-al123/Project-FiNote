# API Documentation — FiNote

Dokumentasi ini disesuaikan dengan implementasi FiNote pada project saat ini. Dokumentasi hanya mencantumkan endpoint yang sudah tersedia dan fitur lanjutan yang sedang dikembangkan sesuai alur screenshot.

## Base URL

Backend API:
`http://localhost:3000/api`

Frontend (Vite):
`http://localhost:5173`

> **Catatan port:** frontend berjalan di port `5173`, sedangkan backend berjalan di port `3000`. Frontend saat ini memanggil backend secara langsung melalui `VITE_API_BASE_URL`, bukan melalui proxy Vite.

---

## Response Format

### Success

Endpoint API yang berhasil menggunakan format:

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

### Error

Error aplikasi menggunakan format:

```json
{
  "success": false,
  "message": "string",
  "data": null
}
```

> Endpoint `/health` merupakan pengecualian karena mengembalikan format sederhana `{ "status": "ok" }`. Route yang tidak ditemukan (`404`) juga dapat mengembalikan response HTML bawaan Express.

### Header Request

| Key | Value | Keterangan |
|---|---|---|
| `Content-Type` | `application/json` | Digunakan untuk request yang memiliki body JSON |
| `Authorization` | `Bearer <token>` | Wajib untuk endpoint yang membutuhkan autentikasi |

---

## Token

FiNote menggunakan **JWT (JSON Web Token)** untuk autentikasi.

| Token | Expire | Kegunaan |
|---|---|---|
| JWT | `JWT_EXPIRES_IN` di `.env` (default `7d`) | Dikirim pada header `Authorization` |

Payload JWT yang dibuat backend:

```json
{
  "user_id": 1,
  "email": "siti@example.com",
  "iat": 0,
  "exp": 0
}
```

`iat` dan `exp` diisi otomatis oleh library JWT.

> Saat ini hanya ada satu token JWT. Belum terdapat `refreshToken` maupun endpoint logout. Setelah token kedaluwarsa, pengguna harus login kembali.

---

# Auth

## 1. Register

Membuat akun pengguna baru dan langsung mengembalikan JWT. Setelah registrasi berhasil, pengguna dapat dianggap sudah login.

```http
POST /api/auth/register
```

### Authentication

Tidak diperlukan.

### Request Body

```json
{
  "nama": "Siti Maria",
  "email": "siti@example.com",
  "password": "passwordAman123"
}
```

### Validasi

| Field | Aturan |
|---|---|
| `nama` | Wajib dan tidak boleh kosong. Spasi di awal/akhir dibuang. |
| `email` | Wajib, harus memiliki format email yang valid, dan harus unik. Disimpan dalam huruf kecil. |
| `password` | Wajib dan minimal 8 karakter. Password disimpan sebagai hash bcrypt. |

### Response `201 Created`

```json
{
  "success": true,
  "message": "Registrasi berhasil.",
  "data": {
    "user": {
      "user_id": 1,
      "nama": "Siti Maria",
      "email": "siti@example.com",
      "created_at": "2026-10-05 10:00:00"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

> Field `password` tidak dikembalikan kepada frontend.

### Error Responses

| Status | Pesan | Kondisi |
|---|---|---|
| `400` | `Nama, email, dan password wajib diisi.` | Salah satu field kosong/tidak ada |
| `400` | `Format email tidak valid.` | Format email tidak sesuai |
| `400` | `Password minimal 8 karakter.` | Password kurang dari 8 karakter |
| `409` | `Email sudah terdaftar.` | Email sudah digunakan |
| `500` | `Terjadi kesalahan pada server.` | Error server yang tidak terduga |

---

## 2. Login

Melakukan autentikasi pengguna yang sudah terdaftar.

```http
POST /api/auth/login
```

### Authentication

Tidak diperlukan.

### Request Body

```json
{
  "email": "siti@example.com",
  "password": "passwordAman123"
}
```

### Validasi

| Field | Aturan |
|---|---|
| `email` | Wajib dan harus memiliki format email yang valid |
| `password` | Wajib dan tidak boleh kosong |

> Login saat ini hanya menggunakan **email dan password**. Belum mendukung username atau nomor HP.

### Response `200 OK`

```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "user": {
      "user_id": 1,
      "nama": "Siti Maria",
      "email": "siti@example.com",
      "created_at": "2026-10-05 10:00:00"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses

| Status | Pesan | Kondisi |
|---|---|---|
| `400` | `Email dan password wajib diisi.` | Email atau password kosong |
| `400` | `Format email tidak valid.` | Format email tidak sesuai |
| `401` | `Email atau password salah.` | Email tidak terdaftar atau password salah |
| `500` | `Terjadi kesalahan pada server.` | Error server yang tidak terduga |

> Pesan `401` sengaja dibuat sama untuk email yang tidak terdaftar dan password yang salah agar keberadaan akun tidak mudah ditebak.

---

## 3. Get Current User

Mengambil data pengguna berdasarkan `user_id` yang terdapat pada JWT.

```http
GET /api/auth/me
```

### Authentication

Wajib menggunakan JWT.

### Header

```http
Authorization: Bearer <token>
```

### Response `200 OK`

```json
{
  "success": true,
  "message": "Data pengguna berhasil diambil.",
  "data": {
    "user": {
      "user_id": 1,
      "nama": "Siti Maria",
      "email": "siti@example.com",
      "created_at": "2026-10-05 10:00:00"
    }
  }
}
```

### Error Responses

| Status | Pesan | Kondisi |
|---|---|---|
| `401` | `Token tidak ditemukan. Silakan login.` | Header tidak ada atau bukan format `Bearer <token>` |
| `401` | `Token tidak valid atau sudah kedaluwarsa.` | Token salah, dimanipulasi, atau sudah expired |
| `404` | `Pengguna tidak ditemukan.` | Token valid tetapi user sudah tidak ada |
| `500` | `Terjadi kesalahan pada server.` | Error server yang tidak terduga |

> Kata `Bearer` harus ditulis persis `Bearer` karena pengecekan scheme bersifat case-sensitive.

---

# Health Check

Mengecek apakah server backend sedang berjalan.

```http
GET http://localhost:3000/health
```

Endpoint ini **tidak menggunakan prefix `/api`** dan tidak membutuhkan autentikasi.

### Response `200 OK`

```json
{
  "status": "ok"
}
```

---

# Error Umum

| Status | Kondisi |
|---|---|
| `400` | Body JSON tidak valid. Error parser Express akan ditangani sebagai error server dan response menggunakan pesan umum. |
| `404` | Route tidak tersedia. Saat ini Express mengembalikan response HTML bawaan karena belum ada custom 404 handler. |
| `500` | Error tak terduga. Detail error ditulis pada log server dan tidak dikirim ke client. |

---

# Alur Penggunaan Token

```text
Register / Login
      │
      ▼
  JWT token
  (default berlaku 7 hari)
      │
      ▼
Frontend menyimpan token
(localStorage)
      │
      ▼
Request ke endpoint terproteksi
      │
      ▼
Authorization: Bearer <token>
      │
      ▼
Server melakukan verifikasi JWT
      │
      ├── Valid → request diproses
      │
      └── Tidak valid/expired → 401
                              │
                              ▼
                       Frontend hapus sesi
                       dan arahkan login
```

---

# Contoh Pemanggilan dari Frontend

Frontend menggunakan `VITE_API_BASE_URL`.

Default pada project:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Contoh login:

```js
const BASE_URL = 'http://localhost:3000/api'

const res = await fetch(`${BASE_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'siti@example.com',
    password: 'passwordAman123',
  }),
})

const json = await res.json()

if (!json.success) {
  throw new Error(json.message)
}

const { user, token } = json.data
```

Contoh request terproteksi:

```js
const me = await fetch(`${BASE_URL}/auth/me`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})

const data = await me.json()
```

Frontend project saat ini juga memiliki wrapper `request()` di:

```text
frontend/src/api/client.js
```

dan pemanggilan khusus autentikasi di:

```text
frontend/src/api/auth.api.js
```

---

# Contoh cURL

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nama":"Siti Maria","email":"siti@example.com","password":"passwordAman123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"siti@example.com","password":"passwordAman123"}'
```

### Current User

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### Health Check

```bash
curl http://localhost:3000/health
```

---

# CORS

Backend menggunakan konfigurasi CORS dengan:

```text
credentials: true
```

Origin yang diizinkan oleh konfigurasi saat ini adalah:

- nilai `CORS_ORIGIN` dari `.env`
- `http://localhost:5173`
- `http://127.0.0.1:5173`

Default:

```env
CORS_ORIGIN=http://localhost:5173
```

Request tanpa origin, misalnya dari Postman/cURL, juga diperbolehkan oleh konfigurasi CORS.

> Frontend Vite pada project ini menggunakan `http://localhost:5173` dan memanggil backend secara langsung. File `frontend/vite.config.js` **belum menggunakan proxy**.

---

# Konfigurasi Backend (`.env`)

Konfigurasi yang digunakan backend:

| Variable | Default | Keterangan |
|---|---|---|
| `PORT` | `3000` | Port server backend |
| `DB_PATH` | `database/FiNote.db` | Lokasi database SQLite |
| `JWT_SECRET` | `finote_secret_key_2026_sangat_panjang_dan_aman` | Secret untuk menandatangani JWT |
| `JWT_EXPIRES_IN` | `7d` | Masa berlaku JWT |
| `CORS_ORIGIN` | `http://localhost:5173` | Origin frontend yang diizinkan |

> Untuk deployment/production, `JWT_SECRET` harus diganti dengan secret yang aman dan tidak dibagikan ke repository publik.

### Menjalankan Backend

Kebutuhan Node.js pada `package.json`:

```text
Node.js >= 22.5.0
```

Perintah:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend akan berjalan pada:

```text
http://localhost:3000
```

Menjalankan test:

```bash
npm test
```

---

# Skema Database

Database yang digunakan adalah **SQLite**. Pada saat server dimulai, backend menjalankan:

```text
database/schema.sql
```

Statement pada schema menggunakan `IF NOT EXISTS`, sehingga schema dapat dijalankan kembali tanpa membuat tabel yang sama dua kali.

Database utama pada project saat ini:

```text
backend/database/FiNote.db
```

## Tabel `User`

Tabel `User` digunakan oleh endpoint autentikasi yang sudah tersedia.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `user_id` | INTEGER | Primary key, auto increment |
| `nama` | TEXT | Wajib |
| `email` | TEXT | Wajib dan unik |
| `password` | TEXT | Hash bcrypt |
| `created_at` | TEXT | Waktu saat data dibuat |

Password menggunakan bcrypt dengan **10 salt rounds**.

## Tabel Lain

Schema database juga sudah memiliki:

- `Kategori`
- `Transaksi`
- `Budget`
- `Tagihan`

Namun tabel-tabel tersebut **belum memiliki endpoint API pada implementasi saat ini**.

Route untuk transaksi, kategori, budget, dan tagihan baru akan ditambahkan setelah controller/service masing-masing selesai dikerjakan.

---

# Fitur Lanjutan: Pengeluaran dan Ringkasan Keuangan

Fitur ini mengikuti alur backlog dari screenshot, terutama `BE-03 Jumlah Pengeluaran` dan `BE-04 Mencatat Pengeluaran`.

## 1. Daftar kategori

```http
GET /api/kategori
```

Header:

```http
Authorization: Bearer <token>
```

Response `200 OK`:

```json
{
  "success": true,
  "message": "Daftar kategori berhasil diambil.",
  "data": {
    "categories": [
      { "kategori_id": 1, "nama_kategori": "Makanan" },
      { "kategori_id": 2, "nama_kategori": "Transportasi" },
      { "kategori_id": 3, "nama_kategori": "Hiburan" }
    ]
  }
}
```

## 2. Tambah kategori

```http
POST /api/kategori
```

Request:

```json
{
  "nama_kategori": "Kesehatan"
}
```

Response `201 Created`:

```json
{
  "success": true,
  "message": "Kategori berhasil dibuat.",
  "data": {
    "category": {
      "kategori_id": 4,
      "nama_kategori": "Kesehatan"
    }
  }
}
```

## 3. Daftar transaksi pengeluaran

```http
GET /api/transaksi
```

Header:

```http
Authorization: Bearer <token>
```

Query params opsional:

- `kategori_id`: id kategori
- `tanggal`: format `YYYY-MM-DD`
- `periode`: `harian`, `bulanan`, `tahunan`
- `search`: pencarian berdasarkan catatan atau nama kategori

Response `200 OK`:

```json
{
  "success": true,
  "message": "Daftar transaksi berhasil diambil.",
  "data": {
    "transactions": [
      {
        "transaksi_id": 10,
        "user_id": 1,
        "kategori_id": 1,
        "nama_kategori": "Makanan",
        "jumlah": 25000,
        "tanggal": "2026-10-12",
        "catatan": "Makan siang",
        "created_at": "2026-10-12 12:45:00"
      }
    ]
  }
}
```

## 4. Tambah transaksi pengeluaran

```http
POST /api/transaksi
```

Request:

```json
{
  "kategori_id": 1,
  "jumlah": 25000,
  "tanggal": "2026-10-12",
  "catatan": "Makan siang"
}
```

Validasi:

- `kategori_id` wajib ada dan valid
- `jumlah` wajib > 0
- `tanggal` wajib diisi dengan format `YYYY-MM-DD`
- `catatan` bersifat optional

Response `201 Created`:

```json
{
  "success": true,
  "message": "Transaksi berhasil ditambahkan.",
  "data": {
    "transaction": {
      "transaksi_id": 10,
      "user_id": 1,
      "kategori_id": 1,
      "jumlah": 25000,
      "tanggal": "2026-10-12",
      "catatan": "Makan siang",
      "created_at": "2026-10-12 12:45:00"
    }
  }
}
```

## 5. Detail transaksi pengeluaran

```http
GET /api/transaksi/:transaksi_id
```

Response `200 OK`:

```json
{
  "success": true,
  "message": "Detail transaksi berhasil diambil.",
  "data": {
    "transaction": {
      "transaksi_id": 10,
      "user_id": 1,
      "kategori_id": 1,
      "nama_kategori": "Makanan",
      "jumlah": 25000,
      "tanggal": "2026-10-12",
      "catatan": "Makan siang",
      "created_at": "2026-10-12 12:45:00"
    }
  }
}
```

## 6. Update transaksi pengeluaran

```http
PUT /api/transaksi/:transaksi_id
```

Request:

```json
{
  "kategori_id": 2,
  "jumlah": 30000,
  "tanggal": "2026-10-13",
  "catatan": "Transport ke kantor"
}
```

Response `200 OK`:

```json
{
  "success": true,
  "message": "Transaksi berhasil diperbarui.",
  "data": {
    "transaction": {
      "transaksi_id": 10,
      "kategori_id": 2,
      "jumlah": 30000,
      "tanggal": "2026-10-13",
      "catatan": "Transport ke kantor"
    }
  }
}
```

## 7. Hapus transaksi pengeluaran

```http
DELETE /api/transaksi/:transaksi_id
```

Response `200 OK`:

```json
{
  "success": true,
  "message": "Transaksi berhasil dihapus.",
  "data": null
}
```

## 8. Ringkasan total pengeluaran

```http
GET /api/transaksi/summary
```

Query params opsional:

- `periode`: `harian`, `bulanan`, `tahunan`
- `tanggal`: `YYYY-MM-DD` untuk filter harian
- `bulan`: `YYYY-MM` untuk filter bulanan

Response `200 OK`:

```json
{
  "success": true,
  "message": "Ringkasan pengeluaran berhasil diambil.",
  "data": {
    "total_pengeluaran": 125000,
    "periode": "bulanan",
    "bulan": "2026-10"
  }
}
```

## 9. Ringkasan dashboard pengeluaran

```http
GET /api/dashboard/summary
```

Response `200 OK`:

```json
{
  "success": true,
  "message": "Ringkasan dashboard berhasil diambil.",
  "data": {
    "total_pengeluaran_hari_ini": 50000,
    "total_pengeluaran_bulan_ini": 125000,
    "jumlah_transaksi": 12,
    "kategori_terbanyak": "Makanan"
  }
}
```

---

# Ringkasan Endpoint yang Sudah Tersedia

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `POST` | `/api/auth/register` | Tidak | Membuat akun dan JWT |
| `POST` | `/api/auth/login` | Tidak | Login pengguna |
| `GET` | `/api/auth/me` | Ya | Mengambil data pengguna saat ini |
| `GET` | `/health` | Tidak | Mengecek status backend |

---

# Status Implementasi API

### Sudah tersedia

- [x] Register
- [x] Login
- [x] JWT Authentication
- [x] Current User (`/auth/me`)
- [x] Health Check
- [x] Validasi input register/login
- [x] Error response standar
- [x] CORS
- [x] SQLite database

### Belum tersedia

- [ ] CRUD Transaksi
- [ ] CRUD Kategori
- [ ] CRUD Budget
- [ ] CRUD Tagihan
- [ ] Refresh Token
- [ ] Logout endpoint
- [ ] Custom 404 JSON handler

---

# Catatan Akhir

Dokumen ini mengikuti gaya dokumentasi referensi yang kamu kirim, tetapi tetap disesuaikan dengan keadaan project FiNote saat ini: autentikasi sudah selesai, sementara arus pengeluaran dan ringkasan dashboard masih menjadi fitur lanjutan yang akan dikembangkan di backend.
