// category.routes.js
const express = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const categoryController = require('../controllers/category.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', categoryController.listCategories);
router.post('/', categoryController.createCategory);

module.exports = router;