'use strict';

const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/masterData.service');

const list = asyncHandler(async (req, res) => {
  const items = await service.list(req.params.entity, req.query);
  return res.status(200).json({ items });
});

const create = asyncHandler(async (req, res) => {
  if (req.body.id) {
    const config = service.resolveConfig(req.params.entity);
    const file = req.files?.[config.imageField]?.[0] || req.files?.companyLogoFile?.[0] || null;
    const item = await service.update(req.params.entity, req.body.id, req.body, file);
    return res.status(200).json(item);
  }
  const config = service.resolveConfig(req.params.entity);
  const file = req.files?.[config.imageField]?.[0] || req.files?.companyLogoFile?.[0] || null;
  const item = await service.create(req.params.entity, req.body, file);
  return res.status(201).json(item);
});

const update = asyncHandler(async (req, res) => {
  const config = service.resolveConfig(req.params.entity);
  const file = req.files?.[config.imageField]?.[0] || req.files?.companyLogoFile?.[0] || null;
  const item = await service.update(req.params.entity, req.params.id, req.body, file);
  return res.status(200).json(item);
});

const remove = asyncHandler(async (req, res) => {
  await service.softDelete(req.params.entity, req.params.id);
  return res.status(204).send();
});

module.exports = { list, create, update, remove };
