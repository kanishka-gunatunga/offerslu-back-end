'use strict';

const express = require('express');
const authRoutes = require('./auth.routes');
const offerRoutes = require('./offer.routes');
const masterDataRoutes = require('./masterData.routes');
const publicRoutes = require('./public.routes');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/health', (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

router.use('/admin/auth', authRoutes);
router.use('/admin/offers', offerRoutes);
router.use('/admin/master-data', masterDataRoutes);
router.get('/admin/health', authenticate, (_req, res) => res.status(200).json({ ok: true }));
router.use('/public', publicRoutes);

module.exports = router;
