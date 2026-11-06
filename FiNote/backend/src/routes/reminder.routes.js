const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const reminderController = require('../controllers/reminder.controller');

// Semua endpoint pengingat memerlukan JWT.
router.use(authMiddleware);

// GET /api/pengingat (daftar + ringkasan per bulan, BE-06)
router.get('/', reminderController.list);

module.exports = router;
