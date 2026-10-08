# FiNote API Contract — Authentication

Base URL lokal:
`http://localhost:3000/api`

Semua request JSON menggunakan header:
`Content-Type: application/json`

Endpoint yang membutuhkan autentikasi menggunakan:
`Authorization: Bearer <JWT>`

## 1. Register

`POST /auth/register`

Request:
```json
{
  "nama": "Siti Maria",
  "email": "siti@example.com",
  "password": "passwordAman123"
}
```

Success `201`:
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
    "token": "JWT..."
  }
}
```

## 2. Login

`POST /auth/login`

Request:
```json
{
  "email": "siti@example.com",
  "password": "passwordAman123"
}
```

Success `200`:
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
    "token": "JWT..."
  }
}
```

## 3. Current User

`GET /auth/me`

Header:
`Authorization: Bearer <JWT>`

Success `200`:
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

## Error format

Semua error API menggunakan bentuk:
```json
{
  "success": false,
  "message": "Pesan error.",
  "data": null
}
```

Contoh login gagal `401`:
```json
{
  "success": false,
  "message": "Email atau password salah.",
  "data": null
}
```

## Catatan integrasi frontend

- Login saat ini hanya menggunakan **email**, bukan nomor HP.
- JWT dikirim frontend pada header `Authorization` sebagai `Bearer <token>`.
- Password tidak pernah dikirim kembali ke frontend.
- Token berlaku sesuai `JWT_EXPIRES_IN` pada `.env` (default 7 hari).
