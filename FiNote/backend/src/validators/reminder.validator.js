// Validasi query string untuk daftar pengingat (BE-06).
// Mengembalikan { error } atau { filters } yang sudah dibersihkan.

const { tanggalValid } = require('../utils/dateHelper');

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
  const { bulan, tanggal } = query;
  const filters = {};

  for (const [nama, nilai] of Object.entries({ bulan, tanggal })) {
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

  return { filters };
}

module.exports = { validateDaftarPengingatQuery, bulanValid };
