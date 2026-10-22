const dashboardService = require('../services/dashboard.service');
const { sukses, gagal } = require('../utils/response');
const { tanggalValid } = require('../utils/dateHelper');

// GET /api/dashboard/summary?tanggal=YYYY-MM-DD (tanggal opsional)
function summary(req, res, next) {
  try {
    const { tanggal } = req.query;

    if (tanggal !== undefined && !tanggalValid(tanggal)) {
      return gagal(res, 400, 'Format tanggal harus YYYY-MM-DD dan tanggalnya harus valid.');
    }

    const data = dashboardService.getSummary(req.user.user_id, tanggal);
    return sukses(res, 200, 'Ringkasan dashboard berhasil diambil.', data);
  } catch (err) {
    return next(err);
  }
}

module.exports = { summary };
