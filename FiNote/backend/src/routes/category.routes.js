// category.routes.js
const express = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const categoryController = require('../controllers/category.controller');

const router = express.Router();

// Semua endpoint kategori memerlukan JWT.
router.use(authenticate);

// GET /api/categories
router.get('/', categoryController.listCategories);

// POST /api/categories
// Body JSON: { "nama_kategori": "Transportasi" }
router.post('/', categoryController.createCategory);

module.exports = router;