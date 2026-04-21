'use strict';

const path = require('path');
const fs = require('fs/promises');
const { Op } = require('sequelize');
const { Offer, Category, Merchant, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildPageMeta } = require('../utils/pagination');
const logger = require('../config/logger');

const offerIncludes = [
  { model: Merchant, as: 'merchant' },
  { model: Category, as: 'categories', through: { attributes: [] } },
];

const normalizeCategoryIds = (value) => {
  if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => Number(v.trim()))
      .filter(Number.isFinite);
  }
  return [];
};

const assertMerchantExists = async (merchantId) => {
  const merchant = await Merchant.findByPk(merchantId);
  if (!merchant) throw ApiError.badRequest(`Merchant not found (id=${merchantId})`);
  return merchant;
};

const assertCategoriesExist = async (categoryIds) => {
  const unique = [...new Set(categoryIds)];
  if (!unique.length) throw ApiError.badRequest('At least one category is required');
  const categories = await Category.findAll({ where: { id: unique } });
  if (categories.length !== unique.length) {
    const found = new Set(categories.map((c) => c.id));
    const missing = unique.filter((id) => !found.has(id));
    throw ApiError.badRequest(`Categories not found: ${missing.join(', ')}`);
  }
  return categories;
};

const removeFileSafe = async (relativePath) => {
  if (!relativePath) return;
  try {
    const abs = path.resolve(process.cwd(), relativePath);
    await fs.unlink(abs);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.warn(`Failed to remove file ${relativePath}: ${err.message}`);
    }
  }
};

const mapAttachment = (file) =>
  file
    ? {
        attachmentPath: path.relative(process.cwd(), file.path).replace(/\\/g, '/'),
        attachmentName: file.originalname,
        attachmentMimeType: file.mimetype,
      }
    : {};

const createOffer = async (payload, file) => {
  const categoryIds = normalizeCategoryIds(payload.categoryIds);
  await assertMerchantExists(payload.merchantId);
  await assertCategoriesExist(categoryIds);

  const t = await sequelize.transaction();
  try {
    const offer = await Offer.create(
      {
        title: payload.title,
        description: payload.description,
        merchantId: payload.merchantId,
        expiryDate: payload.expiryDate,
        status: payload.status || 'active',
        ...mapAttachment(file),
      },
      { transaction: t }
    );

    await offer.setCategories(categoryIds, { transaction: t });
    await t.commit();

    return Offer.findByPk(offer.id, { include: offerIncludes });
  } catch (err) {
    await t.rollback();
    if (file) await removeFileSafe(path.relative(process.cwd(), file.path));
    throw err;
  }
};

const updateOffer = async (id, payload, file) => {
  const offer = await Offer.findByPk(id);
  if (!offer) throw ApiError.notFound('Offer not found');

  const t = await sequelize.transaction();
  try {
    if (payload.merchantId) await assertMerchantExists(payload.merchantId);

    let categoryIds;
    if (payload.categoryIds !== undefined) {
      categoryIds = normalizeCategoryIds(payload.categoryIds);
      await assertCategoriesExist(categoryIds);
    }

    const updates = {};
    ['title', 'description', 'merchantId', 'expiryDate', 'status'].forEach((key) => {
      if (payload[key] !== undefined) updates[key] = payload[key];
    });

    let previousAttachment = null;

    if (file) {
      previousAttachment = offer.attachmentPath;
      Object.assign(updates, mapAttachment(file));
    } else if (payload.removeAttachment) {
      previousAttachment = offer.attachmentPath;
      updates.attachmentPath = null;
      updates.attachmentName = null;
      updates.attachmentMimeType = null;
    }

    await offer.update(updates, { transaction: t });
    if (categoryIds) {
      await offer.setCategories(categoryIds, { transaction: t });
    }
    await t.commit();

    if (previousAttachment) await removeFileSafe(previousAttachment);

    return Offer.findByPk(id, { include: offerIncludes });
  } catch (err) {
    await t.rollback();
    if (file) await removeFileSafe(path.relative(process.cwd(), file.path));
    throw err;
  }
};

const deleteOffer = async (id) => {
  const offer = await Offer.findByPk(id);
  if (!offer) throw ApiError.notFound('Offer not found');
  const attachment = offer.attachmentPath;
  await offer.destroy();
  if (attachment) await removeFileSafe(attachment);
};

const getOffer = async (id) => {
  const offer = await Offer.findByPk(id, { include: offerIncludes });
  if (!offer) throw ApiError.notFound('Offer not found');
  return offer;
};

const listOffers = async (query) => {
  const { page, limit, offset } = parsePagination(query);
  const where = {};
  const now = new Date();

  if (query.status) where.status = query.status;
  if (query.merchantId) where.merchantId = query.merchantId;

  if (query.search) {
    const like = `%${query.search}%`;
    where[Op.or] = [{ title: { [Op.like]: like } }, { description: { [Op.like]: like } }];
  }

  if (query.expired === true) where.expiryDate = { [Op.lt]: now };
  else if (query.expired === false) where.expiryDate = { [Op.gte]: now };

  if (query.expiryFrom || query.expiryTo) {
    where.expiryDate = where.expiryDate || {};
    if (query.expiryFrom) where.expiryDate[Op.gte] = new Date(query.expiryFrom);
    if (query.expiryTo) where.expiryDate[Op.lte] = new Date(query.expiryTo);
  }

  const include = [
    { model: Merchant, as: 'merchant' },
    {
      model: Category,
      as: 'categories',
      through: { attributes: [] },
      ...(query.categoryId ? { where: { id: query.categoryId }, required: true } : {}),
    },
  ];

  // When filtering by category we must ensure distinct count
  const { rows, count } = await Offer.findAndCountAll({
    where,
    include,
    order: [[query.sortBy || 'createdAt', query.sortOrder || 'DESC']],
    limit,
    offset,
    distinct: true,
    subQuery: false,
  });

  return {
    items: rows,
    meta: buildPageMeta({ total: count, page, limit }),
  };
};

module.exports = {
  createOffer,
  updateOffer,
  deleteOffer,
  getOffer,
  listOffers,
};
