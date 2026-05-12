'use strict';

const express = require('express');
const controller = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { verifyAdminOrigin } = require('../middlewares/csrf.middleware');
const schemas = require('../validators/auth.validator');
const env = require('../config/env');
const { createLoginLimiter } = require('../middlewares/rateLimit.middleware');

const router = express.Router();

const loginLimiter = createLoginLimiter(env);

router.post('/login', loginLimiter, validate(schemas.login), controller.login);
router.post('/logout', authenticate, verifyAdminOrigin, controller.logout);
router.get('/session', controller.sessionState);

module.exports = router;
