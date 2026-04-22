'use strict';

const asyncHandler = require('../utils/asyncHandler');
const publicService = require('../services/public.service');

const siteContent = asyncHandler(async (_req, res) => {
  const payload = await publicService.getSiteContent();
  return res.status(200).json(payload);
});

module.exports = { siteContent };
