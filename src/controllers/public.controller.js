'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const publicService = require('../services/public.service');

const siteContent = asyncHandler(async (_req, res) => {
  const payload = await publicService.getSiteContent();
  return res.status(200).json(payload);
});

const promotionSearchFilters = asyncHandler(async (_req, res) => {
  const payload = await publicService.getPromotionSearchFilters();
  return res.status(200).json(payload);
});

const searchPromotions = asyncHandler(async (req, res) => {
  const promotions = await publicService.searchPromotions(req.query || {});
  return res.status(200).json({ promotions });
});

const promotionsByCategory = asyncHandler(async (req, res) => {
  const category = req.query.category?.trim();
  if (!category) {
    throw ApiError.badRequest('Query parameter "category" is required');
  }

  const promotions = await publicService.getPromotionsByCategory(category);
  return res.status(200).json({ promotions });
});

const promotionById = asyncHandler(async (req, res) => {
  const id = req.params.id?.trim();
  if (!id) {
    throw ApiError.badRequest('Path parameter "id" is required');
  }

  const promotion = await publicService.getPromotionById(id);
  if (!promotion) {
    throw ApiError.notFound('Promotion not found');
  }

  return res.status(200).json({ promotion });
});

module.exports = {
  siteContent,
  promotionSearchFilters,
  searchPromotions,
  promotionsByCategory,
  promotionById,
};
