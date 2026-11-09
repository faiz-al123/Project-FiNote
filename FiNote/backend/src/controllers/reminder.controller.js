const reminderService = require('../services/reminder.service');
const { sukses, gagal } = require('../utils/response');
const {
  validateDaftarPengingatQuery,
  idPengingatValid,
} = require('../validators/reminder.validator');

// GET /api/pengingat?bulan=YYYY-MM&tanggal=YYYY-MM-DD&filter=semua|terdekat|terlewat|selesai&search=kata
// (semua parameter opsional)
function list(req, res, next) {
  try {
    const { error, filters } = validateDaftarPengingatQuery(req.query);
    if (error) {
      return gagal(res, 400, 'Input tidak valid.', { detail: error });
    }

    const hasil = reminderService.getDaftarPengingat(req.user.user_id, filters);

    // Tidak ada pengingat yang cocok: tetap 200 dengan daftar kosong
    const pesan =
      hasil.reminders.length === 0
        ? 'Data tidak ditemukan.'
        : 'Daftar pengingat berhasil diambil.';

    return sukses(res, 200, pesan, hasil);
  } catch (err) {
    return next(err);
  }
}


// Ambil id dari alamat; kalau bukan bilangan bulat positif -> 400
function ambilId(req, res) {
  if (!idPengingatValid(req.params.id)) {
    gagal(res, 400, 'Input tidak valid.', { detail: 'id pengingat harus berupa angka.' });
    return null;
  }
  return Number(req.params.id);
}

// POST /api/pengingat   (body sudah divalidasi oleh middleware validate)
function create(req, res, next) {
  try {
    const reminder = reminderService.createPengingat(req.user.user_id, req.body);
    return sukses(res, 201, 'Berhasil disimpan', { reminder });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/pengingat/:id
function update(req, res, next) {
  try {
    const id = ambilId(req, res);
    if (id === null) return undefined;

    const reminder = reminderService.updatePengingat(req.user.user_id, id, req.body);
    return sukses(res, 200, 'Berhasil diubah', { reminder });
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/pengingat/:id
function remove(req, res, next) {
  try {
    const id = ambilId(req, res);
    if (id === null) return undefined;

    reminderService.deletePengingat(req.user.user_id, id);
    return sukses(res, 200, 'Berhasil dihapus', { pengingat_id: id });
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/pengingat/:id/selesai
function selesai(req, res, next) {
  try {
    const id = ambilId(req, res);
    if (id === null) return undefined;

    const reminder = reminderService.tandaiSelesai(req.user.user_id, id);
    return sukses(res, 200, 'Pengingat ditandai selesai.', { reminder });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, create, update, remove, selesai };
