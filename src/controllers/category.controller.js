'use strict';

const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const service = require('../services/category.service');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.list(req.query);
  return apiResponse.success(res, { data: items, meta });
});

const getById = asyncHandler(async (req, res) =>
  apiResponse.success(res, { data: await service.getById(req.params.id) })
);

const create = asyncHandler(async (req, res) =>
  apiResponse.created(res, {
    message: 'Category created',
    data: await service.create(req.body),
  })
);

const update = asyncHandler(async (req, res) =>
  apiResponse.success(res, {
    message: 'Category updated',
    data: await service.update(req.params.id, req.body),
  })
);

const remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  return apiResponse.success(res, { message: 'Category deleted' });
});

module.exports = { list, getById, create, update, remove };
