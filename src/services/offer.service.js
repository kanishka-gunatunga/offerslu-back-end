'use strict';

const { Op } = require('sequelize');
const {
  Offer,
  OfferType,
  Category,
  Merchant,
  Payment,
  Bank,
  Location,
  sequelize,
} = require('../models');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const { ensureImageSignature } = require('../middlewares/upload.middleware');
const { saveImage, removeByUrl } = require('./fileStorage.service');
const {
  parseIdArrayField,
  parseOptionalIdArrayField,
  hasField,
} = require('../utils/requestParsers');

const offerIncludes = [
  { model: OfferType, as: 'offerTypes', through: { attributes: [] } },
  { model: Category, as: 'categories', through: { attributes: [] } },
  { model: Merchant, as: 'merchants', through: { attributes: [] } },
  { model: Payment, as: 'payments', through: { attributes: [] } },
  { model: Bank, as: 'banks', through: { attributes: [] } },
  { model: Location, as: 'locations', through: { attributes: [] } },
];

const toAdminOffer = (offerInstance) => {
  const offer = offerInstance.toJSON();
  return {
    id: offer.id,
    title: offer.title,
    companyName: offer.companyName,
    companyLogoUrl: offer.companyLogoUrl || '',
    heroImageUrl: offer.heroImageUrl,
    description: offer.description,
    category: (offer.categories || []).map((item) => item.name).join(', '),
    offerType: (offer.offerTypes || []).map((item) => item.name).join(', '),
    startDate: offer.startDate,
    endDate: offer.endDate,
    offerTypeIds: (offer.offerTypes || []).map((item) => item.id),
    categoryIds: (offer.categories || []).map((item) => item.id),
    merchantIds: (offer.merchants || []).map((item) => item.id),
    paymentIds: (offer.payments || []).map((item) => item.id),
    bankIds: (offer.banks || []).map((item) => item.id),
    locationIds: (offer.locations || []).map((item) => item.id),
    isInactive: offer.isInactive,
  };
};

const assertEntityIds = async (Model, ids, fieldName) => {
  const uniqueIds = [...new Set(ids)];
  const found = await Model.findAll({ where: { id: uniqueIds } });
  if (found.length !== uniqueIds.length) {
    throw ApiError.badRequest('VALIDATION_ERROR', {
      fields: [{ field: fieldName, message: `Some ${fieldName} do not exist` }],
    });
  }
  return uniqueIds;
};

const validateDates = (startDate, endDate) => {
  if (!startDate || !endDate) {
    throw ApiError.badRequest('VALIDATION_ERROR', {
      fields: [{ field: 'startDate', message: 'startDate and endDate are required' }],
    });
  }
  if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
    throw ApiError.badRequest('VALIDATION_ERROR', {
      fields: [{ field: 'endDate', message: 'endDate must be >= startDate' }],
    });
  }
};

const parsePayload = (payload) => {
  const parsed = {
    title: (payload.title || '').trim(),
    description: (payload.description || '').trim(),
    startDate: payload.startDate,
    endDate: payload.endDate,
    offerTypeIds: parseIdArrayField(payload, 'offerTypeIds'),
    categoryIds: parseIdArrayField(payload, 'categoryIds'),
    merchantIds: parseIdArrayField(payload, 'merchantIds'),
    paymentIds: parseIdArrayField(payload, 'paymentIds'),
    bankIds: parseIdArrayField(payload, 'bankIds'),
    locationIds: parseIdArrayField(payload, 'locationIds'),
    companyName: hasField(payload, 'companyName')
      ? String(payload.companyName || '').trim()
      : undefined,
    companyLogoUrl: hasField(payload, 'companyLogoUrl')
      ? String(payload.companyLogoUrl || '').trim()
      : undefined,
  };
  return parsed;
};

const parseUpdatePayload = (payload) => ({
  title: hasField(payload, 'title') ? String(payload.title || '').trim() : undefined,
  description: hasField(payload, 'description')
    ? String(payload.description || '').trim()
    : undefined,
  startDate: hasField(payload, 'startDate') ? payload.startDate : undefined,
  endDate: hasField(payload, 'endDate') ? payload.endDate : undefined,
  offerTypeIds: parseOptionalIdArrayField(payload, 'offerTypeIds'),
  categoryIds: parseOptionalIdArrayField(payload, 'categoryIds'),
  merchantIds: parseOptionalIdArrayField(payload, 'merchantIds'),
  paymentIds: parseOptionalIdArrayField(payload, 'paymentIds'),
  bankIds: parseOptionalIdArrayField(payload, 'bankIds'),
  locationIds: parseOptionalIdArrayField(payload, 'locationIds'),
  companyName: hasField(payload, 'companyName')
    ? String(payload.companyName || '').trim()
    : undefined,
  companyLogoUrl: hasField(payload, 'companyLogoUrl')
    ? String(payload.companyLogoUrl || '').trim()
    : undefined,
});

const assertCreatePayload = (payload) => {
  if (!payload.title)
    throw ApiError.badRequest('VALIDATION_ERROR', {
      fields: [{ field: 'title', message: 'Required' }],
    });
  if (!payload.description) {
    throw ApiError.badRequest('VALIDATION_ERROR', {
      fields: [{ field: 'description', message: 'Required' }],
    });
  }
  validateDates(payload.startDate, payload.endDate);
};

const enrichCompanyInfo = async (payload) => {
  if (payload.companyName !== undefined && payload.companyName !== '') return payload;
  if (!Array.isArray(payload.merchantIds) || payload.merchantIds.length === 0) return payload;

  const firstMerchant = await Merchant.findByPk(payload.merchantIds[0]);
  if (!firstMerchant) return payload;

  return {
    ...payload,
    companyName: payload.companyName ?? firstMerchant.name,
    companyLogoUrl: payload.companyLogoUrl ?? firstMerchant.logoUrl ?? null,
  };
};

const createOffer = async (rawPayload, file) => {
  const payload = await enrichCompanyInfo(parsePayload(rawPayload));
  assertCreatePayload(payload);
  if (!file) {
    throw ApiError.badRequest('VALIDATION_ERROR', {
      fields: [{ field: 'heroImageFile', message: 'Required for create' }],
    });
  }

  ensureImageSignature(file, { maxSizeBytes: env.upload.heroImageMaxSizeBytes });

  await Promise.all(
    [
      [OfferType, payload.offerTypeIds, 'offerTypeIds'],
      [Category, payload.categoryIds, 'categoryIds'],
      [Merchant, payload.merchantIds, 'merchantIds'],
      [Payment, payload.paymentIds, 'paymentIds'],
      [Bank, payload.bankIds, 'bankIds'],
      [Location, payload.locationIds, 'locationIds'],
    ]
      .filter(([, ids]) => ids.length > 0)
      .map(([Model, ids, fieldName]) => assertEntityIds(Model, ids, fieldName))
  );

  const t = await sequelize.transaction();
  let uploaded = null;

  try {
    const offer = await Offer.create(
      {
        title: payload.title,
        description: payload.description,
        companyName: payload.companyName || '',
        companyLogoUrl: payload.companyLogoUrl || null,
        startDate: payload.startDate,
        endDate: payload.endDate,
        heroImageUrl: '/uploads/pending',
      },
      { transaction: t }
    );

    uploaded = await saveImage({ entity: 'offers', entityId: offer.id, file });
    await offer.update({ heroImageUrl: uploaded.relativeUrl }, { transaction: t });

    await Promise.all([
      offer.setOfferTypes(payload.offerTypeIds, { transaction: t }),
      offer.setCategories(payload.categoryIds, { transaction: t }),
      offer.setMerchants(payload.merchantIds, { transaction: t }),
      offer.setPayments(payload.paymentIds, { transaction: t }),
      offer.setBanks(payload.bankIds, { transaction: t }),
      offer.setLocations(payload.locationIds, { transaction: t }),
    ]);

    await t.commit();
    const created = await Offer.findByPk(offer.id, { include: offerIncludes });
    return toAdminOffer(created);
  } catch (err) {
    await t.rollback();
    if (uploaded?.relativeUrl) await removeByUrl(uploaded.relativeUrl);
    throw err;
  }
};

const updateOffer = async (id, rawPayload, file) => {
  const offer = await Offer.findByPk(id, { include: offerIncludes });
  if (!offer) throw ApiError.notFound('NOT_FOUND');

  const payload = await enrichCompanyInfo(parseUpdatePayload(rawPayload));
  if (payload.startDate || payload.endDate) {
    validateDates(payload.startDate || offer.startDate, payload.endDate || offer.endDate);
  }

  const t = await sequelize.transaction();
  let uploaded = null;
  let previousHeroImageUrl = null;

  try {
    if (payload.offerTypeIds && payload.offerTypeIds.length)
      await assertEntityIds(OfferType, payload.offerTypeIds, 'offerTypeIds');
    if (payload.categoryIds && payload.categoryIds.length)
      await assertEntityIds(Category, payload.categoryIds, 'categoryIds');
    if (payload.merchantIds && payload.merchantIds.length)
      await assertEntityIds(Merchant, payload.merchantIds, 'merchantIds');
    if (payload.paymentIds && payload.paymentIds.length)
      await assertEntityIds(Payment, payload.paymentIds, 'paymentIds');
    if (payload.bankIds && payload.bankIds.length)
      await assertEntityIds(Bank, payload.bankIds, 'bankIds');
    if (payload.locationIds && payload.locationIds.length)
      await assertEntityIds(Location, payload.locationIds, 'locationIds');

    const updates = {};
    if (payload.title !== undefined) updates.title = payload.title;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.startDate) updates.startDate = payload.startDate;
    if (payload.endDate) updates.endDate = payload.endDate;
    if (payload.companyName !== undefined) updates.companyName = payload.companyName;
    if (payload.companyLogoUrl !== undefined) updates.companyLogoUrl = payload.companyLogoUrl;

    if (file) {
      ensureImageSignature(file, { maxSizeBytes: env.upload.heroImageMaxSizeBytes });
      previousHeroImageUrl = offer.heroImageUrl;
      uploaded = await saveImage({ entity: 'offers', entityId: offer.id, file });
      updates.heroImageUrl = uploaded.relativeUrl;
    }

    if (Object.keys(updates).length > 0) {
      await offer.update(updates, { transaction: t });
    }

    if (payload.offerTypeIds !== null)
      await offer.setOfferTypes(payload.offerTypeIds, { transaction: t });
    if (payload.categoryIds !== null)
      await offer.setCategories(payload.categoryIds, { transaction: t });
    if (payload.merchantIds !== null)
      await offer.setMerchants(payload.merchantIds, { transaction: t });
    if (payload.paymentIds !== null)
      await offer.setPayments(payload.paymentIds, { transaction: t });
    if (payload.bankIds !== null) await offer.setBanks(payload.bankIds, { transaction: t });
    if (payload.locationIds !== null)
      await offer.setLocations(payload.locationIds, { transaction: t });

    await t.commit();

    if (
      previousHeroImageUrl &&
      uploaded?.relativeUrl &&
      previousHeroImageUrl !== uploaded.relativeUrl
    ) {
      await removeByUrl(previousHeroImageUrl);
    }

    const updated = await Offer.findByPk(id, { include: offerIncludes });
    return toAdminOffer(updated);
  } catch (err) {
    await t.rollback();
    if (uploaded?.relativeUrl) await removeByUrl(uploaded.relativeUrl);
    throw err;
  }
};

const deleteOffer = async (id) => {
  const offer = await Offer.findByPk(id);
  if (!offer) throw ApiError.notFound('NOT_FOUND');
  if (offer.isInactive) return;
  offer.isInactive = true;
  offer.deletedAt = new Date();
  await offer.save();
};

const getOffer = async (id) => {
  const offer = await Offer.findByPk(id, { include: offerIncludes });
  if (!offer) throw ApiError.notFound('NOT_FOUND');
  return toAdminOffer(offer);
};

const buildStatusWhere = (status) => {
  const today = new Date().toISOString().slice(0, 10);
  if (!status || status === 'all') return {};
  if (status === 'inactive') return { isInactive: true };
  if (status === 'upcoming') return { isInactive: false, startDate: { [Op.gt]: today } };
  if (status === 'expired') return { isInactive: false, endDate: { [Op.lt]: today } };
  if (status === 'active') {
    return {
      isInactive: false,
      startDate: { [Op.lte]: today },
      endDate: { [Op.gte]: today },
    };
  }
  return {};
};

const sortMap = {
  startDesc: ['startDate', 'DESC'],
  startAsc: ['startDate', 'ASC'],
  endAsc: ['endDate', 'ASC'],
  titleAsc: ['title', 'ASC'],
  titleDesc: ['title', 'DESC'],
};

const listOffers = async (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize) || 10, 5), 50);
  const offset = (page - 1) * pageSize;

  const where = {
    ...buildStatusWhere(query.status),
  };

  if (query.q) {
    const like = `%${String(query.q).trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: like } },
      { companyName: { [Op.like]: like } },
      { description: { [Op.like]: like } },
    ];
  }

  const include = [
    {
      model: OfferType,
      as: 'offerTypes',
      through: { attributes: [] },
      ...(query.offerType ? { where: { id: query.offerType }, required: true } : {}),
    },
    {
      model: Category,
      as: 'categories',
      through: { attributes: [] },
      ...(query.category ? { where: { id: query.category }, required: true } : {}),
    },
    {
      model: Merchant,
      as: 'merchants',
      through: { attributes: [] },
      ...(query.merchant ? { where: { id: query.merchant }, required: true } : {}),
    },
    {
      model: Payment,
      as: 'payments',
      through: { attributes: [] },
    },
    {
      model: Bank,
      as: 'banks',
      through: { attributes: [] },
      ...(query.bank ? { where: { id: query.bank }, required: true } : {}),
    },
    {
      model: Location,
      as: 'locations',
      through: { attributes: [] },
      ...(query.location ? { where: { id: query.location }, required: true } : {}),
    },
  ];

  const order = [sortMap[query.sort] || sortMap.startDesc];
  const { rows, count } = await Offer.findAndCountAll({
    where,
    include,
    order,
    limit: pageSize,
    offset,
    distinct: true,
    subQuery: false,
  });

  return {
    items: rows.map(toAdminOffer),
    meta: {
      page,
      pageSize,
      totalItems: count,
      totalPages: Math.max(Math.ceil(count / pageSize), 1),
    },
  };
};

module.exports = { createOffer, updateOffer, deleteOffer, getOffer, listOffers };
