'use strict';

const express = require('express');
const controller = require('../controllers/public.controller');

const router = express.Router();

router.get('/site-content', controller.siteContent);

module.exports = router;
