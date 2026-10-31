const transactionService = require('../services/transaction.service');
const { sukses, gagal } = require('../utils/response');
const { validateRiwayatQuery } = require('../validators/riwayat.validator');

function create(req, res, next) {
  try {
    const transaction = transactionService.createTransaksi(req.user.user_id, req.body);
    sukses(res, 201, 'Pengeluaran berhasil dicatat.', { transaction });
  } catch (err) {
    next(err);
  }
}

// GET /api/transaksi?q=&kategori_id=&tanggal=&dari=&sampai=&page=&limit=
function list(req, res, next) {
  try {
    const { error, filters } = validateRiwayatQuery(req.query);
    if (error) {
      // Pesan sesuai kartu BE-05 (Skenario 3); rincian kesalahan ada di data.detail
      return gagal(res, 400, 'Input tidak valid.', { detail: error });
    }

    const hasil = transactionService.listTransaksi(req.user.user_id, filters);

    // Tidak ada yang cocok: tetap 200 dengan daftar kosong
    const pesan =
      hasil.pagination.total_items === 0
        ? 'Data tidak ditemukan.'
        : 'Riwayat transaksi berhasil diambil.';

    return sukses(res, 200, pesan, hasil);
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, list };
