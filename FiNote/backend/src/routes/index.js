const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const transaksiRoutes = require('./transaksi.routes');
const dashboardRoutes = require('./dashboard.routes');

router.use('/auth', authRoutes);
router.use('/kategori', categoryRoutes);
router.use('/transaksi', transaksiRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
