// Validasi query string untuk daftar pengingat (BE-06).
// Mengembalikan { error } atau { filters } yang sudah dibersihkan.

const { tanggalValid } = require('../utils/dateHelper');

const FILTER_VALID = ['semua', 'terdekat', 'terlewat', 'selesai'];
const SEARCH_MAKS = 100;

function kosong(nilai) {
  return nilai === undefined || String(nilai).trim() === '';
}

// Format bulan: YYYY-MM, bulan 01 sampai 12
function bulanValid(teks) {
  if (!/^\d{4}-\d{2}$/.test(teks)) return false;
  const bulan = Number(teks.slice(5, 7));
  return bulan >= 1 && bulan <= 12;
}

function validateDaftarPengingatQuery(query) {
  const { bulan, tanggal, filter, search } = query;
  const filters = { filter: 'semua' };

  for (const [nama, nilai] of Object.entries({ bulan, tanggal, filter, search })) {
    if (Array.isArray(nilai) || (nilai !== undefined && typeof nilai !== 'string')) {
      return { error: `Parameter ${nama} tidak valid.` };
    }
  }

  if (!kosong(bulan)) {
    if (!bulanValid(bulan.trim())) {
      return { error: 'Format bulan harus YYYY-MM (contoh 2026-11).' };
    }
    filters.bulan = bulan.trim();
  }

  if (!kosong(tanggal)) {
    if (!tanggalValid(tanggal.trim())) {
      return { error: 'Format tanggal harus YYYY-MM-DD dan tanggalnya harus valid.' };
    }
    filters.tanggal = tanggal.trim();
  }

  if (!kosong(filter)) {
    if (!FILTER_VALID.includes(filter.trim())) {
      return { error: `Filter harus salah satu dari: ${FILTER_VALID.join(', ')}.` };
    }
    filters.filter = filter.trim();
  }

  if (!kosong(search)) {
    if (search.trim().length > SEARCH_MAKS) {
      return { error: `Kata pencarian maksimal ${SEARCH_MAKS} karakter.` };
    }
    filters.search = search.trim();
  }

  return { filters };
}


// ---------------------------------------------------------------
// Validasi body untuk tambah dan ubah pengingat (BE-07).
// Keempat kolom wajib diisi: deskripsi, kategori_id, jumlah, tanggal.
// Mengembalikan teks pesan error, atau null jika valid.
// ---------------------------------------------------------------

const DESKRIPSI_MAKS = 200;

function validateTulisPengingat(body) {
  const { deskripsi, kategori_id, jumlah, tanggal } = body;

  // Urutan sesuai kolom di tabel: deskripsi, kategori, nominal, tanggal
  if (typeof deskripsi !== 'string' || deskripsi.trim() === '') {
    return 'Deskripsi wajib diisi.';
  }
  if (deskripsi.trim().length > DESKRIPSI_MAKS) {
    return `Deskripsi maksimal ${DESKRIPSI_MAKS} karakter.`;
  }

  if (kosong(kategori_id)) return 'Kategori wajib dipilih.';
  if (
    !['number', 'string'].includes(typeof kategori_id) ||
    !/^\d+$/.test(String(kategori_id).trim()) ||
    Number(kategori_id) <= 0
  ) {
    return 'Kategori tidak valid.';
  }

  // Skenario 3 di kartu BE-07: selain angka -> "Nominal harus berupa angka"
  if (kosong(jumlah)) return 'Nominal wajib diisi.';
  // Hanya angka atau teks angka biasa (mis. 15000 atau "15000.50").
  // Array, objek, boolean, serta teks seperti "0x10" atau "1e3" ditolak.
  const bentukAngka =
    typeof jumlah === 'number' ||
    (typeof jumlah === 'string' && /^\d+(\.\d+)?$/.test(jumlah.trim()));
  const angka = Number(jumlah);
  if (!bentukAngka || !Number.isFinite(angka)) {
    return 'Nominal harus berupa angka';
  }
  if (angka <= 0) return 'Nominal harus lebih dari 0.';

  if (kosong(tanggal)) return 'Tanggal wajib diisi.';
  if (typeof tanggal !== 'string' || !tanggalValid(tanggal.trim())) {
    return 'Format tanggal harus YYYY-MM-DD dan tanggalnya harus valid.';
  }

  return null;
}

// id pengingat dari alamat (/pengingat/:id) harus bilangan bulat positif
function idPengingatValid(id) {
  return /^\d+$/.test(String(id)) && Number(id) > 0;
}

module.exports = {
  validateDaftarPengingatQuery,
  validateTulisPengingat,
  idPengingatValid,
  bulanValid,
  FILTER_VALID,
};
