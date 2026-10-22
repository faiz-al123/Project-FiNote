const transaksiService = require('../services/transaction.service');
const { sukses } = require('../utils/response');

function create(req, res, next) {
  try {
    const transaction = transactionService.createTransaction(req.user.user_id, req.body);
    sukses(res, 201, 'Pengeluaran berhasil dicatat.', { transaction });
  } catch (err) {
    next(err);
  }
}

module.exports = { create };
