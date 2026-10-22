// Validasi body untuk pencatatan pengeluaran (BE-04).
// Mengembalikan string pesan error, atau null kalau valid.

const { tanggalValid } = require('../utils/dateHelper');

function validateCreateTransaksi(body) {
  const { kategori_id, jumlah, tanggal, catatan } = body;

  // Skenario 2: nominal kosong / tidak valid
  const jumlahKosong =
    jumlah === undefined || jumlah === null || String(jumlah).trim() === '';
  const jumlahAngka = Number(jumlah);

  // Skenario 2: kategori tidak dipilih
  const kategoriKosong =
    kategori_id === undefined || kategori_id === null || String(kategori_id).trim() === '';

  if (jumlahKosong && kategoriKosong) {
    return 'Nominal dan kategori wajib diisi.';
  }
  if (jumlahKosong) {
    return 'Nominal wajib diisi.';
  }
  if (!Number.isFinite(jumlahAngka) || jumlahAngka <= 0) {
    return 'Nominal harus berupa angka lebih dari 0.';
  }
  if (kategoriKosong) {
    return 'Kategori wajib dipilih.';
  }
  if (!Number.isInteger(Number(kategori_id)) || Number(kategori_id) <= 0) {
    return 'Kategori tidak valid.';
  }

  // Skenario 3 & 4: tanggal boleh kosong (otomatis hari ini)
  if (tanggal !== undefined && tanggal !== null && String(tanggal).trim() !== '') {
    if (typeof tanggal !== 'string' || !tanggalValid(tanggal.trim())) {
      return 'Format tanggal harus YYYY-MM-DD dan tanggalnya harus valid.';
    }
  }

  if (catatan !== undefined && catatan !== null && typeof catatan !== 'string') {
    return 'Catatan harus berupa teks.';
  }

  return null;
}

module.exports = { validateCreateTransaksi, tanggalValid };
