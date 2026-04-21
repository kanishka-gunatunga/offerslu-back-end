'use strict';

const Joi = require('joi');

const createCategory = {
  body: Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    description: Joi.string().trim().max(500).allow('', null),
    isActive: Joi.boolean(),
  }),
};

const updateCategory = {
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
  body: Joi.object({
    name: Joi.string().trim().min(1).max(100),
    description: Joi.string().trim().max(500).allow('', null),
    isActive: Joi.boolean(),
  }).min(1),
};

const createMerchant = {
  body: Joi.object({
    name: Joi.string().trim().min(1).max(150).required(),
    email: Joi.string().email().allow('', null),
    phone: Joi.string().trim().max(30).allow('', null),
    website: Joi.string().uri().allow('', null),
    logoUrl: Joi.string().uri().allow('', null),
    isActive: Joi.boolean(),
  }),
};

const updateMerchant = {
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
  body: Joi.object({
    name: Joi.string().trim().min(1).max(150),
    email: Joi.string().email().allow('', null),
    phone: Joi.string().trim().max(30).allow('', null),
    website: Joi.string().uri().allow('', null),
    logoUrl: Joi.string().uri().allow('', null),
    isActive: Joi.boolean(),
  }).min(1),
};

const listQuery = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    search: Joi.string().trim().max(200).allow(''),
    isActive: Joi.boolean(),
  }),
};

const byId = {
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
};

module.exports = {
  createCategory,
  updateCategory,
  createMerchant,
  updateMerchant,
  listQuery,
  byId,
};
