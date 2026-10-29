const db = require('../config/db');
const { tanggalHariIni, bulanDariTanggal } = require('../utils/dateHelper');

// Jumlahkan pengeluaran milik satu user pada rentang tanggal [dari, sampai].
// COALESCE membuat hasilnya 0 (bukan null) kalau belum ada catatan -> Skenario 2.
function totalPada(userId, dari, sampai) {
  const baris = db
    .prepare(`
      SELECT COALESCE(SUM(jumlah), 0) AS total
      FROM Transaksi
      WHERE user_id = ? AND tanggal >= ? AND tanggal <= ?
    `)
    .get(userId, dari, sampai);
  return baris.total;
}

// Ringkasan untuk 2 widget dashboard: pengeluaran hari ini & bulan ini.
// "tanggal" boleh dikirim frontend (zona waktu pengguna); default hari ini di server.
function getSummary(userId, tanggal) {
  const hariIni = tanggal || tanggalHariIni();
  const bulan = bulanDariTanggal(hariIni);

  return {
    tanggal: hariIni,
    bulan,
    total_pengeluaran_hari_ini: totalPada(userId, hariIni, hariIni),
    // string "YYYY-MM-DD" bisa dibandingkan urut abjad, jadi 01..31 cukup untuk satu bulan
    total_pengeluaran_bulan_ini: totalPada(userId, `${bulan}-01`, `${bulan}-31`),
  };
}


// Total pengeluaran per kategori untuk grafik dashboard (BE-03.2).
// Semua kategori ikut tampil (total 0 jika belum ada pengeluaran), sesuai desain grafik.
// periode: 'bulanan' (default, bulan dari "tanggal") atau 'harian' (hanya "tanggal").
function getTotalPerKategori(userId, { periode = 'bulanan', tanggal } = {}) {
  const acuan = tanggal || tanggalHariIni();
  const bulan = bulanDariTanggal(acuan);

  const dari = periode === 'harian' ? acuan : `${bulan}-01`;
  const sampai = periode === 'harian' ? acuan : `${bulan}-31`;

  const baris = db
    .prepare(`
      SELECT k.kategori_id, k.nama_kategori, COALESCE(SUM(t.jumlah), 0) AS total
      FROM Kategori k
      LEFT JOIN Transaksi t
        ON t.kategori_id = k.kategori_id
       AND t.user_id = ?
       AND t.tanggal >= ?
       AND t.tanggal <= ?
      GROUP BY k.kategori_id, k.nama_kategori
      ORDER BY k.kategori_id
    `)
    .all(userId, dari, sampai);

  // Kategori dengan total tertinggi diberi tanda (grafik: batang merah "Tertinggi").
  // Jika belum ada pengeluaran sama sekali, tidak ada yang ditandai.
  const tertinggi = Math.max(0, ...baris.map((b) => b.total));
  const categories = baris.map((b) => ({
    ...b,
    tertinggi: tertinggi > 0 && b.total === tertinggi,
  }));

  return { periode, tanggal: acuan, bulan, categories };
}

module.exports = { getSummary, getTotalPerKategori };
