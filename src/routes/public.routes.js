'use strict';

const express = require('express');
const controller = require('../controllers/public.controller');

const router = express.Router();

router.get('/site-content', controller.siteContent);
router.get('/promotions/search-filters', controller.promotionSearchFilters);
router.get('/promotions/search', controller.searchPromotions);
router.get('/promotions', controller.promotionsByCategory);
router.get('/promotions/:id', controller.promotionById);

module.exports = router;
