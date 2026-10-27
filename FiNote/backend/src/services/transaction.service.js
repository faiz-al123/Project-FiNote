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


// Riwayat transaksi milik satu user dengan pencarian, filter, dan halaman (BE-05).
// Semua nilai dari pengguna masuk lewat parameter (?), tidak pernah disambung
// ke teks SQL, sehingga aman dari SQL injection.
function listTransaksi(userId, filters) {
  const { q, kategori_id, tanggal, dari, sampai, page, limit } = filters;

  const kondisi = ['t.user_id = ?'];
  const params = [userId];

  if (q) {
    // Cari di deskripsi ATAU nama kategori. Karakter % dan _ milik pengguna di-escape
    // supaya dianggap huruf biasa.
    const pola = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
    kondisi.push("(t.catatan LIKE ? ESCAPE '\\' OR k.nama_kategori LIKE ? ESCAPE '\\')");
    params.push(pola, pola);
  }
  if (kategori_id) {
    kondisi.push('t.kategori_id = ?');
    params.push(kategori_id);
  }
  if (tanggal) {
    kondisi.push('t.tanggal = ?');
    params.push(tanggal);
  }
  if (dari) {
    kondisi.push('t.tanggal >= ?');
    params.push(dari);
  }
  if (sampai) {
    kondisi.push('t.tanggal <= ?');
    params.push(sampai);
  }

  const where = kondisi.join(' AND ');

  const { total } = db
    .prepare(`
      SELECT COUNT(*) AS total
      FROM Transaksi t
      JOIN Kategori k ON k.kategori_id = t.kategori_id
      WHERE ${where}
    `)
    .get(...params);

  const transactions = db
    .prepare(`
      SELECT t.transaksi_id, t.tanggal, t.catatan, t.kategori_id,
             k.nama_kategori, t.jumlah
      FROM Transaksi t
      JOIN Kategori k ON k.kategori_id = t.kategori_id
      WHERE ${where}
      ORDER BY t.tanggal DESC, t.transaksi_id DESC
      LIMIT ? OFFSET ?
    `)
    .all(...params, limit, (page - 1) * limit);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total_items: total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

module.exports = { createTransaksi, listTransaksi, findById, tanggalHariIni };
