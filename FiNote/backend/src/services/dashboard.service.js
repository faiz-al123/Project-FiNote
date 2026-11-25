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

  // kosong = belum ada pengeluaran sama sekali pada periode ini (BE-10, Skenario 2):
  // frontend menampilkan tombol yang mengarahkan ke halaman catat transaksi.
  return { periode, tanggal: acuan, bulan, kosong: tertinggi === 0, categories };
}

// Widget "Total Transaksi" (BE-10): jumlah catatan transaksi, bukan jumlah uangnya.
//  - total_transaksi            : seluruh transaksi milik pengguna
//  - total_transaksi_bulan_ini  : transaksi pada bulan dari tanggal acuan
function getTotalTransaksi(userId, tanggal) {
  const acuan = tanggal || tanggalHariIni();
  const bulan = bulanDariTanggal(acuan);

  const { n: semua } = db
    .prepare('SELECT COUNT(*) AS n FROM Transaksi WHERE user_id = ?')
    .get(userId);

  const { n: bulanIni } = db
    .prepare('SELECT COUNT(*) AS n FROM Transaksi WHERE user_id = ? AND tanggal >= ? AND tanggal <= ?')
    .get(userId, `${bulan}-01`, `${bulan}-31`);

  return {
    tanggal: acuan,
    bulan,
    total_transaksi: semua,
    total_transaksi_bulan_ini: bulanIni,
  };
}

// Widget "Daftar Pengeluaran Terbaru" (BE-10): transaksi paling baru milik pengguna.
// Diurutkan dari tanggal terbaru; pada tanggal yang sama, yang dicatat terakhir di atas.
function getTransaksiTerbaru(userId, limit) {
  const transactions = db
    .prepare(`
      SELECT t.transaksi_id, t.tanggal, t.catatan, t.kategori_id,
             k.nama_kategori, t.jumlah
      FROM Transaksi t
      JOIN Kategori k ON k.kategori_id = t.kategori_id
      WHERE t.user_id = ?
      ORDER BY t.tanggal DESC, t.transaksi_id DESC
      LIMIT ?
    `)
    .all(userId, limit);

  return { limit, transactions };
}

module.exports = { getSummary, getTotalPerKategori, getTotalTransaksi, getTransaksiTerbaru };
