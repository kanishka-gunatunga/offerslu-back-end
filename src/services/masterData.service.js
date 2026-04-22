'use strict';

const { OfferType, Category, Merchant, Payment, Bank, Location } = require('../models');
const ApiError = require('../utils/ApiError');
const { ensureImageSignature } = require('../middlewares/upload.middleware');
const { saveImage, removeByUrl } = require('./fileStorage.service');

const CONFIG = {
  'offer-types': { model: OfferType, imageField: null, imageColumn: null, storageDir: null },
  categories: {
    model: Category,
    imageField: 'bannerImageFile',
    imageColumn: 'bannerImageUrl',
    storageDir: 'categories',
  },
  merchants: {
    model: Merchant,
    imageField: 'logoImageFile',
    imageColumn: 'logoUrl',
    storageDir: 'merchants',
  },
  payments: { model: Payment, imageField: null, imageColumn: null, storageDir: null },
  banks: { model: Bank, imageField: 'logoImageFile', imageColumn: 'logoUrl', storageDir: 'banks' },
  locations: { model: Location, imageField: null, imageColumn: null, storageDir: null },
};

const resolveConfig = (entity) => {
  const config = CONFIG[entity];
  if (!config) throw ApiError.notFound('NOT_FOUND');
  return config;
};

const list = async (entity, query) => {
  const { model } = resolveConfig(entity);
  const where = {};
  if (query.status) where.status = query.status;
  if (query.parentId !== undefined) where.parentId = query.parentId || null;

  const rows = await model.findAll({ where, order: [['name', 'ASC']] });
  return rows.map((item) => item.toJSON());
};

const create = async (entity, payload, file) => {
  const config = resolveConfig(entity);
  if (!payload.name || !String(payload.name).trim()) {
    throw ApiError.badRequest('VALIDATION_ERROR', {
      fields: [{ field: 'name', message: 'Required' }],
    });
  }

  let uploaded = null;
  try {
    const created = await config.model.create({
      name: String(payload.name).trim(),
      parentId: payload.parentId || null,
      status: payload.status || 'active',
    });

    if (config.imageField) {
      if (file) {
        ensureImageSignature(file);
        uploaded = await saveImage({ entity: config.storageDir, entityId: created.id, file });
        await created.update({ [config.imageColumn]: uploaded.relativeUrl });
      }
    }

    return created.toJSON();
  } catch (err) {
    if (uploaded?.relativeUrl) await removeByUrl(uploaded.relativeUrl);
    throw err;
  }
};

const update = async (entity, id, payload, file) => {
  const config = resolveConfig(entity);
  const item = await config.model.findByPk(id);
  if (!item) throw ApiError.notFound('NOT_FOUND');

  let uploaded = null;
  const previousImage = config.imageColumn ? item[config.imageColumn] : null;
  try {
    const updates = {};
    if (payload.name !== undefined) updates.name = String(payload.name).trim();
    if (payload.parentId !== undefined) updates.parentId = payload.parentId || null;
    if (payload.status !== undefined) updates.status = payload.status;

    if (config.imageField && file) {
      ensureImageSignature(file);
      uploaded = await saveImage({ entity: config.storageDir, entityId: item.id, file });
      updates[config.imageColumn] = uploaded.relativeUrl;
    }

    if (Object.keys(updates).length > 0) await item.update(updates);
    if (previousImage && uploaded?.relativeUrl && previousImage !== uploaded.relativeUrl) {
      await removeByUrl(previousImage);
    }

    return item.toJSON();
  } catch (err) {
    if (uploaded?.relativeUrl) await removeByUrl(uploaded.relativeUrl);
    throw err;
  }
};

const softDelete = async (entity, id) => {
  const { model } = resolveConfig(entity);
  const item = await model.findByPk(id);
  if (!item) throw ApiError.notFound('NOT_FOUND');
  item.status = 'inactive';
  await item.save();
};

module.exports = { resolveConfig, list, create, update, softDelete };
