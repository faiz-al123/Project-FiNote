const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  validateUbahProfil,
  validateGantiPassword,
} = require('../validators/profile.validator');
const profileController = require('../controllers/profile.controller');

// Semua endpoint profil memerlukan JWT (BE-09: wajib cek autentikasi).
router.use(authMiddleware);

// GET /api/profil
router.get('/', profileController.show);

// PUT /api/profil  (username dan/atau email)
router.put('/', validate(validateUbahProfil), profileController.update);

// PUT /api/profil/password
router.put('/password', validate(validateGantiPassword), profileController.changePassword);

module.exports = router;
