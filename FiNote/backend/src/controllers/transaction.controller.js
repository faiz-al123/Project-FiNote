const transactionService = require('../services/transaction.service');
const { sukses } = require('../utils/response');

function create(req, res, next) {
  try {
    const transaction = transactionService.createTransaksi(req.user.user_id, req.body);
    sukses(res, 201, 'Pengeluaran berhasil dicatat.', { transaction });
  } catch (err) {
    next(err);
  }
}

module.exports = { create };
