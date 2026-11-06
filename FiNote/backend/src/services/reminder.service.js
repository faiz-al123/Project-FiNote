const db = require('../config/db');
const { tanggalHariIni, bulanDariTanggal } = require('../utils/dateHelper');

// Daftar pengingat milik satu user pada satu bulan, beserta ringkasannya (BE-06).
//  - bulan   : 'YYYY-MM' (default: bulan dari tanggal acuan)
//  - tanggal : tanggal acuan "hari ini" 'YYYY-MM-DD' (default: hari ini di server).
//              Frontend sebaiknya mengirim tanggal lokal browser.
//
// Definisi:
//  - selesai        : status 'selesai'
//  - terlewat       : belum selesai dan jatuh tempo sebelum tanggal acuan
//  - terdekat       : pengingat belum selesai pertama yang jatuh tempo pada/setelah tanggal acuan
function getDaftarPengingat(userId, { bulan, tanggal } = {}) {
  const acuan = tanggal || tanggalHariIni();
  const bulanDipilih = bulan || bulanDariTanggal(acuan);

  const baris = db
    .prepare(`
      SELECT pengingat_id, nama_pengingat, jenis, jumlah,
             tanggal_jatuh_tempo, status, selesai_pada
      FROM Pengingat
      WHERE user_id = ? AND tanggal_jatuh_tempo >= ? AND tanggal_jatuh_tempo <= ?
      ORDER BY tanggal_jatuh_tempo ASC, pengingat_id ASC
    `)
    .all(userId, `${bulanDipilih}-01`, `${bulanDipilih}-31`);

  const reminders = baris.map((r) => ({
    ...r,
    terlewat: r.status === 'belum_selesai' && r.tanggal_jatuh_tempo < acuan,
  }));

  const selesai = reminders.filter((r) => r.status === 'selesai').length;
  const terlewat = reminders.filter((r) => r.terlewat).length;
  const terdekat =
    reminders.find((r) => r.status === 'belum_selesai' && r.tanggal_jatuh_tempo >= acuan) || null;

  return {
    bulan: bulanDipilih,
    tanggal_acuan: acuan,
    ringkasan: {
      total: reminders.length,
      selesai,
      belum_selesai: reminders.length - selesai,
      terlewat,
      terdekat,
    },
    reminders,
  };
}

module.exports = { getDaftarPengingat };
