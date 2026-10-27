const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { validateCreateTransaksi } = require('../validators/transaksi.validator');
const transactionController = require('../controllers/transaction.controller');

// Semua endpoint transaksi memerlukan JWT.
router.use(authMiddleware);

// GET /api/transaksi (riwayat + pencarian + filter, BE-05)
router.get('/', transactionController.list);

// POST /api/transaksi
router.post('/', validate(validateCreateTransaksi), transactionController.create);

module.exports = router;
