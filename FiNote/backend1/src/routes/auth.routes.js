const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { validateRegister, validateLogin } = require('../validators/auth.validator');

// POST /api/auth/register
router.post('/register', validate(validateRegister), authController.register);

// POST /api/auth/login
router.post('/login', validate(validateLogin), authController.login);

// GET /api/auth/me
router.get('/me', authMiddleware, authController.me);

module.exports = router;
