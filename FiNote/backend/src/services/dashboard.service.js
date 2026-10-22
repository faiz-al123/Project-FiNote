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

module.exports = { getSummary };
