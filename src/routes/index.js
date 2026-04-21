'use strict';

const express = require('express');
const authRoutes = require('./auth.routes');
const offerRoutes = require('./offer.routes');
const categoryRoutes = require('./category.routes');
const merchantRoutes = require('./merchant.routes');
const dashboardRoutes = require('./dashboard.routes');

const router = express.Router();

router.get('/health', (_req, res) =>
  res.json({ success: true, message: 'OK', timestamp: new Date().toISOString() })
);

router.use('/auth', authRoutes);
router.use('/offers', offerRoutes);
router.use('/categories', categoryRoutes);
router.use('/merchants', merchantRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
