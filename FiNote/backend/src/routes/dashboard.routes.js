const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');

// Semua endpoint dashboard memerlukan JWT.
router.use(authMiddleware);

// GET /api/dashboard/summary
router.get('/summary', dashboardController.summary);

module.exports = router;
