const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const transaksiRoutes = require('./transaction.routes');
const dashboardRoutes = require('./dashboard.routes');
const reminderRoutes = require('./reminder.routes');

router.use('/auth', authRoutes);
router.use('/kategori', categoryRoutes);
router.use('/transaksi', transaksiRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/pengingat', reminderRoutes);

module.exports = router;
