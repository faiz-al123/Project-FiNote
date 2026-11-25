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


// GET /api/dashboard/kategori?periode=bulanan|harian&tanggal=YYYY-MM-DD (keduanya opsional)
function perKategori(req, res, next) {
  try {
    const { periode, tanggal } = req.query;

    if (periode !== undefined && !['bulanan', 'harian'].includes(periode)) {
      return gagal(res, 400, 'Periode harus bulanan atau harian.');
    }
    if (tanggal !== undefined && !tanggalValid(tanggal)) {
      return gagal(res, 400, 'Format tanggal harus YYYY-MM-DD dan tanggalnya harus valid.');
    }

    const data = dashboardService.getTotalPerKategori(req.user.user_id, { periode, tanggal });
    return sukses(res, 200, 'Total pengeluaran per kategori berhasil diambil.', data);
  } catch (err) {
    return next(err);
  }
}

// GET /api/dashboard/total-transaksi?tanggal=YYYY-MM-DD (tanggal opsional)
function totalTransaksi(req, res, next) {
  try {
    const { tanggal } = req.query;

    if (tanggal !== undefined && !tanggalValid(tanggal)) {
      return gagal(res, 400, 'Format tanggal harus YYYY-MM-DD dan tanggalnya harus valid.');
    }

    const data = dashboardService.getTotalTransaksi(req.user.user_id, tanggal);
    return sukses(res, 200, 'Total transaksi berhasil diambil.', data);
  } catch (err) {
    return next(err);
  }
}

// GET /api/dashboard/terbaru?limit=5 (limit opsional, 1 sampai 20)
const LIMIT_TERBARU_DEFAULT = 5;
const LIMIT_TERBARU_MAKS = 20;

function terbaru(req, res, next) {
  try {
    const { limit } = req.query;
    let jumlah = LIMIT_TERBARU_DEFAULT;

    if (limit !== undefined && limit !== '') {
      const valid =
        typeof limit === 'string' &&
        /^\d+$/.test(limit) &&
        Number(limit) >= 1 &&
        Number(limit) <= LIMIT_TERBARU_MAKS;

      if (!valid) {
        return gagal(res, 400, 'Input tidak valid.', {
          detail: `limit harus berupa angka 1 sampai ${LIMIT_TERBARU_MAKS}.`,
        });
      }
      jumlah = Number(limit);
    }

    const data = dashboardService.getTransaksiTerbaru(req.user.user_id, jumlah);

    // Belum ada transaksi: tetap 200 dengan daftar kosong (Skenario 2)
    const pesan =
      data.transactions.length === 0
        ? 'Data tidak ditemukan.'
        : 'Pengeluaran terbaru berhasil diambil.';

    return sukses(res, 200, pesan, data);
  } catch (err) {
    return next(err);
  }
}

module.exports = { summary, perKategori, totalTransaksi, terbaru };
