'use strict';

const Joi = require('joi');

const categoryIdsSchema = Joi.alternatives().try(
  Joi.array().items(Joi.number().integer().positive()).min(1),
  Joi.string().custom((value, helpers) => {
    const ids = value
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isFinite(v));
    if (!ids.length) return helpers.error('any.invalid');
    return ids;
  })
);

const create = {
  body: Joi.object({
    title: Joi.string().trim().min(1).max(200).required(),
    description: Joi.string().trim().min(1).required(),
    merchantId: Joi.number().integer().positive().required(),
    categoryIds: categoryIdsSchema.required(),
    expiryDate: Joi.date().iso().greater('now').required(),
    status: Joi.string().valid('active', 'inactive').default('active'),
  }),
};

const update = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    title: Joi.string().trim().min(1).max(200),
    description: Joi.string().trim().min(1),
    merchantId: Joi.number().integer().positive(),
    categoryIds: categoryIdsSchema,
    expiryDate: Joi.date().iso(),
    status: Joi.string().valid('active', 'inactive'),
    removeAttachment: Joi.boolean(),
  }).min(1),
};

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().max(200).allow(''),
    merchantId: Joi.number().integer().positive(),
    categoryId: Joi.number().integer().positive(),
    status: Joi.string().valid('active', 'inactive'),
    expired: Joi.boolean(),
    expiryFrom: Joi.date().iso(),
    expiryTo: Joi.date().iso(),
    sortBy: Joi.string()
      .valid('createdAt', 'updatedAt', 'expiryDate', 'title')
      .default('createdAt'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
  }),
};

const byId = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

module.exports = { create, update, list, byId };
