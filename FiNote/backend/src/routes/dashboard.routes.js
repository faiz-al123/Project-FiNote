const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');

// Semua endpoint dashboard memerlukan JWT.
router.use(authMiddleware);

// GET /api/dashboard/summary
router.get('/summary', dashboardController.summary);

// GET /api/dashboard/kategori (grafik pengeluaran per kategori, BE-03.2)
router.get('/kategori', dashboardController.perKategori);

module.exports = router;
