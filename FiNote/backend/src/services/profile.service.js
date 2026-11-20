const bcrypt = require('bcryptjs');
const db = require('../config/db');
const userModel = require('../models/user.model');
const AppError = require('../utils/appError');

const SALT_ROUNDS = 10;

// Data untuk halaman Profil: informasi akun + dua angka di kartu samping.
//  - total_transaksi : jumlah transaksi pengeluaran milik pengguna
//  - pengingat_aktif : pengingat yang belum ditandai selesai (termasuk yang terlewat)
// Password tidak pernah ikut dikirim.
function getProfil(userId) {
  const user = userModel.findById(userId);
  if (!user) {
    throw new AppError('Pengguna tidak ditemukan.', 404);
  }

  const { n: totalTransaksi } = db
    .prepare('SELECT COUNT(*) AS n FROM Transaksi WHERE user_id = ?')
    .get(userId);

  const { n: pengingatAktif } = db
    .prepare("SELECT COUNT(*) AS n FROM Pengingat WHERE user_id = ? AND status = 'belum_selesai'")
    .get(userId);

  return {
    user_id: user.user_id,
    username: user.nama,
    email: user.email,
    bergabung_sejak: user.created_at.slice(0, 10),
    total_transaksi: totalTransaksi,
    pengingat_aktif: pengingatAktif,
  };
}

// Ubah username dan/atau email. Yang tidak dikirim tidak berubah.
function updateProfil(userId, { username, email }) {
  const sekarang = userModel.findById(userId);
  if (!sekarang) {
    throw new AppError('Pengguna tidak ditemukan.', 404);
  }

  const namaBaru = username !== undefined ? username.trim() : sekarang.nama;
  const emailBaru = email !== undefined ? email.trim().toLowerCase() : sekarang.email;

  // Cek bentrok dengan pengguna lain (milik sendiri tidak dihitung)
  if (userModel.findByNamaExcept(namaBaru, userId)) {
    throw new AppError('Username sudah dipakai.', 409);
  }
  if (userModel.findByEmailExcept(emailBaru, userId)) {
    throw new AppError('Email sudah terdaftar.', 409);
  }

  try {
    userModel.updateProfil(userId, { nama: namaBaru, email: emailBaru });
  } catch (err) {
    // Jaga-jaga kalau dua permintaan bersamaan sama-sama lolos pengecekan di atas
    const pesan = String(err.message || '');
    if (pesan.includes('UNIQUE constraint failed: User.nama')) {
      throw new AppError('Username sudah dipakai.', 409);
    }
    if (pesan.includes('UNIQUE constraint failed: User.email')) {
      throw new AppError('Email sudah terdaftar.', 409);
    }
    throw err;
  }

  return getProfil(userId);
}

// Ganti password: password lama harus cocok dengan yang tersimpan di database.
// Memakai status 400 (bukan 401) supaya frontend tidak mengira sesi habis lalu logout otomatis.
async function gantiPassword(userId, { password_lama, password_baru }) {
  const baris = userModel.findPasswordHash(userId);
  if (!baris) {
    throw new AppError('Pengguna tidak ditemukan.', 404);
  }

  const cocok = await bcrypt.compare(password_lama, baris.password);
  if (!cocok) {
    throw new AppError('Password saat ini tidak sesuai', 400);
  }

  const hashBaru = await bcrypt.hash(password_baru, SALT_ROUNDS);
  userModel.updatePassword(userId, hashBaru);
}

module.exports = { getProfil, updateProfil, gantiPassword };
