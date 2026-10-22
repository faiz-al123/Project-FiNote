const db = require('../config/db');
const AppError = require('../utils/appError');
const { tanggalHariIni } = require('../utils/dateHelper');

function findById(transaksiId) {
  return db
    .prepare(`
      SELECT t.transaksi_id, t.user_id, t.kategori_id, k.nama_kategori,
             t.jumlah, t.tanggal, t.catatan, t.created_at
      FROM Transaksi t
      JOIN Kategori k ON k.kategori_id = t.kategori_id
      WHERE t.transaksi_id = ?
    `)
    .get(transaksiId);
}

function createTransaksi(userId, { kategori_id, jumlah, tanggal, catatan }) {
  const kategoriId = Number(kategori_id);

  const kategori = db
    .prepare('SELECT kategori_id FROM Kategori WHERE kategori_id = ?')
    .get(kategoriId);
  if (!kategori) {
    throw new AppError('Kategori tidak valid.', 400);
  }

  const tanggalFinal =
    typeof tanggal === 'string' && tanggal.trim() !== ''
      ? tanggal.trim()
      : tanggalHariIni(); // Skenario 4

  const catatanFinal =
    typeof catatan === 'string' && catatan.trim() !== '' ? catatan.trim() : null;

  const hasil = db
    .prepare(`
      INSERT INTO Transaksi (user_id, kategori_id, jumlah, tanggal, catatan)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(userId, kategoriId, Number(jumlah), tanggalFinal, catatanFinal);

  return findById(Number(hasil.lastInsertRowid));
}

module.exports = { createTransaksi, findById, tanggalHariIni };
