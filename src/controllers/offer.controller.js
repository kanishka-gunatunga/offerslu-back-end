'use strict';

const asyncHandler = require('../utils/asyncHandler');
const offerService = require('../services/offer.service');

const create = asyncHandler(async (req, res) => {
  const offer = await offerService.createOffer(req.body, req.files?.heroImageFile?.[0] || null);
  return res.status(201).json(offer);
});

const update = asyncHandler(async (req, res) => {
  const offer = await offerService.updateOffer(
    req.params.id,
    req.body,
    req.files?.heroImageFile?.[0] || null
  );
  return res.status(200).json(offer);
});

const remove = asyncHandler(async (req, res) => {
  await offerService.deleteOffer(req.params.id);
  return res.status(204).send();
});

const getById = asyncHandler(async (req, res) => {
  const offer = await offerService.getOffer(req.params.id);
  return res.status(200).json(offer);
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await offerService.listOffers(req.query);
  return res.status(200).json({ items, meta });
});

module.exports = { create, update, remove, getById, list };
