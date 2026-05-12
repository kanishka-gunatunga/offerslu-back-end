'use strict';

const express = require('express');
const controller = require('../controllers/public.controller');
const { observePublicRoute, publicCacheHeaders } = require('../middlewares/public.middleware');

const router = express.Router();

router.use(observePublicRoute);
router.use(publicCacheHeaders);

router.get('/site-content', controller.siteContent);
router.get('/promotions/search-filters', controller.promotionSearchFilters);
router.get('/promotions/search', controller.searchPromotions);
router.get('/promotions', controller.promotionsByCategory);
router.get('/promotions/:id', controller.promotionById);

module.exports = router;
