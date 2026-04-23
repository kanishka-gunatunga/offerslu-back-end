'use strict';

const Joi = require('joi');

const idArraySchema = Joi.alternatives().try(
  Joi.array().items(Joi.string().trim().min(1)).min(0),
  Joi.string().trim().allow('')
);

const create = {
  body: Joi.object({
    title: Joi.string().trim().min(1).max(255).required(),
    companyName: Joi.string().trim().min(1).max(160).optional(),
    companyLogoUrl: Joi.string().trim().allow('').optional(),
    description: Joi.string().trim().min(1).required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().required(),
    offerTypeIds: idArraySchema.optional(),
    categoryIds: idArraySchema.optional(),
    merchantIds: idArraySchema.optional(),
    paymentIds: idArraySchema.optional(),
    bankIds: idArraySchema.optional(),
    locationIds: idArraySchema.optional(),
  }).unknown(true),
};

const update = {
  params: Joi.object({
    id: Joi.string().trim().required(),
  }),
  body: Joi.object({
    title: Joi.string().trim().min(1).max(255),
    companyName: Joi.string().trim().min(1).max(160).optional(),
    companyLogoUrl: Joi.string().trim().allow('').optional(),
    description: Joi.string().trim().min(1),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    offerTypeIds: idArraySchema,
    categoryIds: idArraySchema,
    merchantIds: idArraySchema,
    paymentIds: idArraySchema,
    bankIds: idArraySchema,
    locationIds: idArraySchema,
  }).unknown(true),
};

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(5).max(50).default(10),
    q: Joi.string().trim().max(200).allow(''),
    status: Joi.string().valid('active', 'upcoming', 'expired', 'inactive', 'all').default('all'),
    category: Joi.string().trim(),
    offerType: Joi.string().trim(),
    merchant: Joi.string().trim(),
    bank: Joi.string().trim(),
    location: Joi.string().trim(),
    sort: Joi.string()
      .valid('startDesc', 'startAsc', 'endAsc', 'titleAsc', 'titleDesc')
      .default('startDesc'),
  }),
};

const byId = {
  params: Joi.object({
    id: Joi.string().trim().required(),
  }),
};

module.exports = { create, update, list, byId };
