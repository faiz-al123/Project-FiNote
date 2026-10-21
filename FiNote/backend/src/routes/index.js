const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
router.use('/auth', authRoutes);

const categoryRoutes = require('./category.routes');
router.use('/categories', categoryRoutes);

module.exports = router;
