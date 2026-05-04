'use strict';

const { Op, QueryTypes } = require('sequelize');
const {
  sequelize,
  Category,
  Bank,
  Offer,
  OfferType,
  Merchant,
  Payment,
  Location,
} = require('../models');

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const parseDateOnlyUtc = (dateValue) => new Date(`${dateValue}T00:00:00.000Z`);

const calculateDaysLeft = (startDate, endDate) => {
  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  const startUtc = parseDateOnlyUtc(startDate);
  const endUtc = parseDateOnlyUtc(endDate);

  if (endUtc < todayUtc) return 0;
  if (startUtc > todayUtc) return null;

  return Math.max(0, Math.ceil((endUtc - todayUtc) / DAY_IN_MS));
};

const normalizeTag = (value) => String(value || '').trim();

const uniqueCaseInsensitive = (values) => {
  const seen = new Set();
  const uniqueValues = [];

  values.forEach((value) => {
    const normalized = normalizeTag(value);
    if (!normalized) return;

    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    uniqueValues.push(normalized);
  });

  return uniqueValues;
};

const getNamedWithParents = (items = []) =>
  uniqueCaseInsensitive([
    ...items.map((item) => item?.parent?.name),
    ...items.map((item) => item?.name),
  ]);

const buildRelatedTags = (offer) =>
  uniqueCaseInsensitive([
    ...(offer.banks || []).map((item) => item?.name),
    ...(offer.locations || []).map((item) => item?.name),
    ...getNamedWithParents(offer.categories || []),
    ...getNamedWithParents(offer.offerTypes || []),
    ...getNamedWithParents(offer.payments || []),
    ...(offer.merchants || []).map((item) => item?.name),
    offer.companyName,
  ]);

const parseCsvNames = (value) => {
  if (value === undefined || value === null) return [];
  return uniqueCaseInsensitive(String(value).split(','));
};

const toLowerSet = (values) => uniqueCaseInsensitive(values).map((item) => item.toLowerCase());

const buildNameFilter = (associationAlias, namesLower) =>
  sequelize.where(sequelize.fn('LOWER', sequelize.col(`${associationAlias}.name`)), {
    [Op.in]: namesLower,
  });

const buildTextLike = (columnPath, qLike) =>
  sequelize.where(sequelize.fn('LOWER', sequelize.col(columnPath)), { [Op.like]: qLike });

const mapPromotion = (
  offer,
  {
    descriptionFallback = '',
    merchantFallback = '',
    categoryFallback = 'General',
    offerTypeFallback = 'Promotion',
    includeOfferDetails = false,
    includeRelatedTags = false,
  } = {}
) => ({
  id: offer.id,
  title: offer.title,
  description: offer.description || descriptionFallback,
  ...(includeOfferDetails ? { offerDetails: offer.offerDetails || null } : {}),
  offerBannerImageUrl: offer.heroImageUrl || null,
  startDate: offer.startDate,
  endDate: offer.endDate,
  merchant: offer.companyName || merchantFallback,
  category:
    (offer.categories || [])
      .filter((item) => item.parentId === null)
      .map((item) => item.name)
      .join(', ') || categoryFallback,
  offerType: (offer.offerTypes || []).map((item) => item.name).join(', ') || offerTypeFallback,
  ...(includeRelatedTags ? { relatedTags: buildRelatedTags(offer) } : {}),
  daysLeft: calculateDaysLeft(offer.startDate, offer.endDate),
});

const getPromotionSearchFilters = async () => {
  const [categories, offerTypes, paymentTypes, banks] = await Promise.all([
    Category.findAll({
      where: { status: 'active', parentId: null },
      attributes: ['name'],
      order: [['name', 'ASC']],
    }),
    OfferType.findAll({
      where: { status: 'active' },
      attributes: ['name'],
      order: [['name', 'ASC']],
    }),
    Payment.findAll({
      where: { status: 'active' },
      attributes: ['name'],
      order: [['name', 'ASC']],
    }),
    Bank.findAll({
      where: { status: 'active' },
      attributes: ['name'],
      order: [['name', 'ASC']],
    }),
  ]);

  return {
    filters: {
      categories: uniqueCaseInsensitive(categories.map((item) => item.name)),
      offerTypes: uniqueCaseInsensitive(offerTypes.map((item) => item.name)),
      paymentTypes: uniqueCaseInsensitive(paymentTypes.map((item) => item.name)),
      banks: uniqueCaseInsensitive(banks.map((item) => item.name)),
    },
  };
};

const searchPromotions = async (query = {}) => {
  const today = new Date().toISOString().slice(0, 10);
  const q = normalizeTag(query.q);
  const categoryNamesLower = toLowerSet(parseCsvNames(query.categories));
  const offerTypeNamesLower = toLowerSet(parseCsvNames(query.offerTypes));
  const paymentTypeNamesLower = toLowerSet(parseCsvNames(query.paymentTypes));
  const bankNamesLower = toLowerSet(parseCsvNames(query.banks));

  const include = [
    {
      model: OfferType,
      as: 'offerTypes',
      through: { attributes: [] },
      attributes: ['name'],
      required: offerTypeNamesLower.length > 0,
      ...(offerTypeNamesLower.length > 0
        ? { where: buildNameFilter('offerTypes', offerTypeNamesLower) }
        : {}),
    },
    {
      model: Category,
      as: 'categories',
      through: { attributes: [] },
      attributes: ['name', 'parentId'],
      required: categoryNamesLower.length > 0,
      ...(categoryNamesLower.length > 0
        ? { where: buildNameFilter('categories', categoryNamesLower) }
        : {}),
    },
    {
      model: Payment,
      as: 'payments',
      through: { attributes: [] },
      attributes: ['name'],
      required: paymentTypeNamesLower.length > 0,
      ...(paymentTypeNamesLower.length > 0
        ? { where: buildNameFilter('payments', paymentTypeNamesLower) }
        : {}),
    },
    {
      model: Bank,
      as: 'banks',
      through: { attributes: [] },
      attributes: ['name'],
      required: bankNamesLower.length > 0,
      ...(bankNamesLower.length > 0 ? { where: buildNameFilter('banks', bankNamesLower) } : {}),
    },
    { model: Merchant, as: 'merchants', through: { attributes: [] }, attributes: ['name'] },
  ];

  const where = {
    isInactive: false,
    endDate: { [Op.gte]: today },
  };

  if (q) {
    const qLike = `%${q.toLowerCase()}%`;
    where[Op.or] = [
      buildTextLike('Offer.title', qLike),
      buildTextLike('Offer.description', qLike),
      buildTextLike('Offer.company_name', qLike),
      buildTextLike('categories.name', qLike),
      buildTextLike('offerTypes.name', qLike),
      buildTextLike('payments.name', qLike),
      buildTextLike('banks.name', qLike),
      buildTextLike('merchants.name', qLike),
    ];
  }

  const promotions = await Offer.findAll({
    where,
    include,
    order: [['startDate', 'DESC']],
    distinct: true,
    subQuery: false,
  });

  return promotions.map(mapPromotion);
};

const getSiteContent = async () => {
  const today = new Date().toISOString().slice(0, 10);

  const [categories, banks, promotions, offerCountRows, bankOfferCountRows] = await Promise.all([
    Category.findAll({
      where: { status: 'active', parentId: null },
      order: [['name', 'ASC']],
      limit: 20,
    }),
    Bank.findAll({ where: { status: 'active' }, order: [['name', 'ASC']], limit: 20 }),
    Offer.findAll({
      where: {
        isInactive: false,
        endDate: { [Op.gte]: today },
      },
      include: [
        { model: OfferType, as: 'offerTypes', through: { attributes: [] }, attributes: ['name'] },
        {
          model: Category,
          as: 'categories',
          through: { attributes: [] },
          attributes: ['name', 'parentId'],
        },
        { model: Merchant, as: 'merchants', through: { attributes: [] }, attributes: ['name'] },
      ],
      order: [['startDate', 'DESC']],
      limit: 5,
    }),
    sequelize.query(
      `
        SELECT
          oc.category_id AS categoryId,
          COUNT(oc.offer_id) AS offerCount
        FROM offer_categories oc
        INNER JOIN offers o ON o.id = oc.offer_id
        WHERE o.is_inactive = false
        GROUP BY oc.category_id
      `,
      { type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `
        SELECT
          ob.bank_id AS bankId,
          COUNT(ob.offer_id) AS offerCount
        FROM offer_banks ob
        INNER JOIN offers o ON o.id = ob.offer_id
        WHERE o.is_inactive = false
          AND o.end_date >= :today
        GROUP BY ob.bank_id
      `,
      { type: QueryTypes.SELECT, replacements: { today } }
    ),
  ]);

  const offerCountByCategory = offerCountRows.reduce((acc, row) => {
    acc[row.categoryId] = Number(row.offerCount || 0);
    return acc;
  }, {});

  const offerCountByBank = bankOfferCountRows.reduce((acc, row) => {
    acc[row.bankId] = Number(row.offerCount || 0);
    return acc;
  }, {});

  return {
    siteName: 'Offerlu',
    hero: {},
    categories: categories.map((item) => ({
      id: item.id,
      name: item.name,
      bannerImageUrl: item.bannerImageUrl,
      offerCount: offerCountByCategory[item.id] || 0,
    })),
    promotionSections: [],
    promotions: promotions.map(mapPromotion),
    banks: banks.map((bank) => ({
      id: bank.id,
      name: bank.name,
      logoUrl: bank.logoUrl,
      offerCount: offerCountByBank[bank.id] || 0,
    })),
    about: {},
    socialLinks: [],
  };
};

const getPromotionsByCategory = async (categoryName) => {
  const today = new Date().toISOString().slice(0, 10);

  const promotions = await Offer.findAll({
    where: {
      isInactive: false,
      endDate: { [Op.gte]: today },
    },
    include: [
      { model: OfferType, as: 'offerTypes', through: { attributes: [] }, attributes: ['name'] },
      {
        model: Category,
        as: 'categories',
        through: { attributes: [] },
        attributes: ['name', 'parentId'],
        where: { name: categoryName },
        required: true,
      },
      { model: Merchant, as: 'merchants', through: { attributes: [] }, attributes: ['name'] },
    ],
    order: [['startDate', 'DESC']],
  });

  return promotions.map(mapPromotion);
};

const getPromotionById = async (offerId) => {
  const offer = await Offer.findOne({
    where: {
      id: offerId,
      isInactive: false,
    },
    include: [
      {
        model: OfferType,
        as: 'offerTypes',
        through: { attributes: [] },
        attributes: ['name', 'parentId'],
        include: [{ model: OfferType, as: 'parent', attributes: ['name'] }],
      },
      {
        model: Category,
        as: 'categories',
        through: { attributes: [] },
        attributes: ['name', 'parentId'],
        include: [{ model: Category, as: 'parent', attributes: ['name'] }],
      },
      {
        model: Payment,
        as: 'payments',
        through: { attributes: [] },
        attributes: ['name', 'parentId'],
        include: [{ model: Payment, as: 'parent', attributes: ['name'] }],
      },
      { model: Bank, as: 'banks', through: { attributes: [] }, attributes: ['name'] },
      { model: Location, as: 'locations', through: { attributes: [] }, attributes: ['name'] },
      { model: Merchant, as: 'merchants', through: { attributes: [] }, attributes: ['name'] },
    ],
  });

  if (!offer) return null;

  return mapPromotion(offer, {
    descriptionFallback: null,
    merchantFallback: null,
    categoryFallback: null,
    offerTypeFallback: null,
    includeOfferDetails: true,
    includeRelatedTags: true,
  });
};

module.exports = {
  getSiteContent,
  getPromotionsByCategory,
  getPromotionById,
  getPromotionSearchFilters,
  searchPromotions,
};
