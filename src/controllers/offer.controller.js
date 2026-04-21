'use strict';

const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const offerService = require('../services/offer.service');

const create = asyncHandler(async (req, res) => {
  const offer = await offerService.createOffer(req.body, req.file);
  return apiResponse.created(res, { message: 'Offer created', data: offer });
});

const update = asyncHandler(async (req, res) => {
  const offer = await offerService.updateOffer(req.params.id, req.body, req.file);
  return apiResponse.success(res, { message: 'Offer updated', data: offer });
});

const remove = asyncHandler(async (req, res) => {
  await offerService.deleteOffer(req.params.id);
  return apiResponse.success(res, { message: 'Offer deleted' });
});

const getById = asyncHandler(async (req, res) => {
  const offer = await offerService.getOffer(req.params.id);
  return apiResponse.success(res, { data: offer });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await offerService.listOffers(req.query);
  return apiResponse.success(res, { data: items, meta });
});

module.exports = { create, update, remove, getById, list };
