// category.routes.js
const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const categoryController = require('../controllers/category.controller');

const router = express.Router();

// Semua endpoint kategori memerlukan JWT.
router.use(authenticate);

// GET /api/categories
router.get('/', categoryController.listCategories);

// Catatan: kategori bersifat tetap (diisi lewat seed di database/schema.sql),
// jadi tidak ada endpoint untuk menambah kategori.

module.exports = router;