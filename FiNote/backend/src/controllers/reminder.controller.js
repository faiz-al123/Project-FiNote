const reminderService = require('../services/reminder.service');
const { sukses, gagal } = require('../utils/response');
const { validateDaftarPengingatQuery } = require('../validators/reminder.validator');

// GET /api/pengingat?bulan=YYYY-MM&tanggal=YYYY-MM-DD (keduanya opsional)
function list(req, res, next) {
  try {
    const { error, filters } = validateDaftarPengingatQuery(req.query);
    if (error) {
      return gagal(res, 400, 'Input tidak valid.', { detail: error });
    }

    const hasil = reminderService.getDaftarPengingat(req.user.user_id, filters);

    // Tidak ada pengingat pada bulan itu: tetap 200 dengan daftar kosong
    const pesan =
      hasil.ringkasan.total === 0
        ? 'Data tidak ditemukan.'
        : 'Daftar pengingat berhasil diambil.';

    return sukses(res, 200, pesan, hasil);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list };
