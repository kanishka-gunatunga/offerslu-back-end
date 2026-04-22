'use strict';

const Joi = require('joi');

const entitySchema = Joi.string()
  .valid('offer-types', 'categories', 'merchants', 'payments', 'banks', 'locations')
  .required();

const list = {
  params: Joi.object({ entity: entitySchema }),
  query: Joi.object({
    status: Joi.string().valid('active', 'inactive'),
    parentId: Joi.string().allow('', null),
  }),
};

const create = {
  params: Joi.object({ entity: entitySchema }),
  body: Joi.object({
    name: Joi.string().trim().min(1).max(160).required(),
    parentId: Joi.string().trim().allow('', null),
    status: Joi.string().valid('active', 'inactive').default('active'),
  }).unknown(true),
};

const update = {
  params: Joi.object({
    entity: entitySchema,
    id: Joi.string().trim().required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(1).max(160),
    parentId: Joi.string().trim().allow('', null),
    status: Joi.string().valid('active', 'inactive'),
  })
    .min(1)
    .unknown(true),
};

const byId = {
  params: Joi.object({
    entity: entitySchema,
    id: Joi.string().trim().required(),
  }),
};

module.exports = { list, create, update, byId };
