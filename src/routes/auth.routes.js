'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { verifyAdminOrigin } = require('../middlewares/csrf.middleware');
const schemas = require('../validators/auth.validator');
const env = require('../config/env');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.loginMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts' } },
});

router.post('/login', loginLimiter, validate(schemas.login), controller.login);
router.post('/logout', authenticate, verifyAdminOrigin, controller.logout);
router.get('/session', controller.sessionState);

module.exports = router;
