const db = require('../config/db');
const { tanggalHariIni, bulanDariTanggal } = require('../utils/dateHelper');

// "Terdekat" = jatuh tempo kurang dari 3 hari dari tanggal acuan (hari ini, +1, +2).
const BATAS_TERDEKAT_HARI = 3;

// Tambah n hari ke tanggal 'YYYY-MM-DD' (dihitung di UTC agar tidak tergeser zona waktu).
function tambahHari(tanggal, n) {
  const [y, m, d] = tanggal.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// Daftar pengingat milik satu user pada satu bulan + empat angka ringkasan (BE-06).
//  - bulan   : 'YYYY-MM' (default: bulan dari tanggal acuan)
//  - tanggal : tanggal acuan "hari ini" 'YYYY-MM-DD' (default: hari ini di server).
//              Frontend sebaiknya mengirim tanggal lokal browser.
//  - filter  : semua | terdekat | terlewat | selesai   (tombol di atas tabel)
//  - search  : kata kunci pada deskripsi atau nama kategori
//
// Definisi:
//  - selesai  : status 'selesai'
//  - terlewat : belum selesai dan tanggalnya sebelum tanggal acuan
//  - terdekat : belum selesai dan jatuh tempo < 3 hari dari tanggal acuan (belum lewat)
//
// Angka di `ringkasan` selalu dihitung dari SELURUH pengingat bulan itu,
// tidak terpengaruh filter/search (supaya empat kotak di halaman tidak berubah
// saat pengguna menyaring tabel). Hanya `reminders` yang disaring.
function getDaftarPengingat(userId, { bulan, tanggal, filter = 'semua', search } = {}) {
  const acuan = tanggal || tanggalHariIni();
  const bulanDipilih = bulan || bulanDariTanggal(acuan);
  const batas = tambahHari(acuan, BATAS_TERDEKAT_HARI);

  const baris = db
    .prepare(`
      SELECT p.pengingat_id, p.deskripsi, p.kategori_id, k.nama_kategori,
             p.jumlah, p.tanggal, p.status, p.selesai_pada
      FROM Pengingat p
      JOIN Kategori k ON k.kategori_id = p.kategori_id
      WHERE p.user_id = ? AND p.tanggal >= ? AND p.tanggal <= ?
      ORDER BY p.tanggal ASC, p.pengingat_id ASC
    `)
    .all(userId, `${bulanDipilih}-01`, `${bulanDipilih}-31`);

  const semua = baris.map((r) => {
    const belumSelesai = r.status === 'belum_selesai';
    return {
      ...r,
      terlewat: belumSelesai && r.tanggal < acuan,
      terdekat: belumSelesai && r.tanggal >= acuan && r.tanggal < batas,
    };
  });

  const ringkasan = {
    terdekat: semua.filter((r) => r.terdekat).length,
    total: semua.length,
    selesai: semua.filter((r) => r.status === 'selesai').length,
    terlewat: semua.filter((r) => r.terlewat).length,
  };

  const kata = search ? search.toLowerCase() : null;
  const reminders = semua.filter((r) => {
    if (filter === 'terdekat' && !r.terdekat) return false;
    if (filter === 'terlewat' && !r.terlewat) return false;
    if (filter === 'selesai' && r.status !== 'selesai') return false;
    if (kata && !`${r.deskripsi} ${r.nama_kategori}`.toLowerCase().includes(kata)) return false;
    return true;
  });

  return {
    bulan: bulanDipilih,
    tanggal_acuan: acuan,
    filter,
    search: search || null,
    ringkasan,
    reminders,
  };
}

module.exports = { getDaftarPengingat, tambahHari };
