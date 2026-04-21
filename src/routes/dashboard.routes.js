'use strict';

const express = require('express');
const controller = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);
router.get('/stats', controller.stats);

module.exports = router;
