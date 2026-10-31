// Validasi query string untuk riwayat transaksi (BE-05).
// Mengembalikan { error } atau { filters } yang sudah dibersihkan.

const { tanggalValid } = require('../utils/dateHelper');

const LIMIT_DEFAULT = 15; // sesuai desain: 15 baris per halaman
const LIMIT_MAKS = 100;

function kosong(nilai) {
  return nilai === undefined || String(nilai).trim() === '';
}

function bilanganBulatPositif(nilai) {
  return /^\d+$/.test(String(nilai).trim()) && Number(nilai) > 0;
}

function validateRiwayatQuery(query) {
  const { search, kategori_id, nominal, tanggal, dari, sampai, page, limit } = query;
  const filters = {};

  // Parameter yang dikirim dobel (?q=a&q=b) menjadi array -> tolak
  for (const [nama, nilai] of Object.entries({ search, kategori_id, nominal, tanggal, dari, sampai, page, limit })) {
    if (Array.isArray(nilai) || (nilai !== undefined && typeof nilai !== 'string')) {
      return { error: `Parameter ${nama} tidak valid.` };
    }
  }

  if (!kosong(search)) filters.q = search.trim();

  if (!kosong(kategori_id)) {
    if (!bilanganBulatPositif(kategori_id)) return { error: 'Kategori tidak valid.' };
    filters.kategori_id = Number(kategori_id);
  }

  // Nominal: hanya bilangan bulat positif (BE-05: error selain input INTEGER)
  if (!kosong(nominal)) {
    if (!bilanganBulatPositif(nominal)) return { error: 'Nominal harus berupa bilangan bulat lebih dari 0.' };
    filters.nominal = Number(nominal);
  }

  for (const [nama, nilai] of [['tanggal', tanggal], ['dari', dari], ['sampai', sampai]]) {
    if (kosong(nilai)) continue;
    if (!tanggalValid(nilai.trim())) {
      return { error: `Format ${nama} harus YYYY-MM-DD dan tanggalnya harus valid.` };
    }
    filters[nama] = nilai.trim();
  }

  if (filters.tanggal && (filters.dari || filters.sampai)) {
    return { error: 'Gunakan tanggal saja, atau dari/sampai, jangan keduanya.' };
  }
  if (filters.dari && filters.sampai && filters.dari > filters.sampai) {
    return { error: 'Tanggal dari tidak boleh lebih besar dari tanggal sampai.' };
  }

  filters.page = 1;
  if (!kosong(page)) {
    if (!bilanganBulatPositif(page)) return { error: 'Page harus berupa angka lebih dari 0.' };
    filters.page = Number(page);
  }

  filters.limit = LIMIT_DEFAULT;
  if (!kosong(limit)) {
    if (!bilanganBulatPositif(limit) || Number(limit) > LIMIT_MAKS) {
      return { error: `Limit harus berupa angka 1 sampai ${LIMIT_MAKS}.` };
    }
    filters.limit = Number(limit);
  }

  return { filters };
}

module.exports = { validateRiwayatQuery };
