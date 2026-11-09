const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { validateTulisPengingat } = require('../validators/reminder.validator');
const reminderController = require('../controllers/reminder.controller');

// Semua endpoint pengingat memerlukan JWT.
router.use(authMiddleware);

// GET /api/pengingat (daftar + ringkasan per bulan, BE-06)
router.get('/', reminderController.list);

// BE-07: kelola pengingat
// POST   /api/pengingat              tambah
router.post('/', validate(validateTulisPengingat), reminderController.create);
// PUT    /api/pengingat/:id          ubah
router.put('/:id', validate(validateTulisPengingat), reminderController.update);
// DELETE /api/pengingat/:id          hapus
router.delete('/:id', reminderController.remove);
// PATCH  /api/pengingat/:id/selesai  tandai selesai
router.patch('/:id/selesai', reminderController.selesai);

module.exports = router;
