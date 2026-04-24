'use strict';

const { Op, QueryTypes } = require('sequelize');
const { sequelize, Category, Bank, Offer, OfferType, Merchant } = require('../models');

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
    promotions: promotions.map((offer) => ({
      id: offer.id,
      title: offer.title,
      description: offer.description || '',
      offerBannerImageUrl: offer.heroImageUrl,
      startDate: offer.startDate,
      endDate: offer.endDate,
      merchant: offer.companyName || '',
      category:
        (offer.categories || [])
          .filter((item) => item.parentId === null)
          .map((item) => item.name)
          .join(', ') || 'General',
      offerType: (offer.offerTypes || []).map((item) => item.name).join(', ') || 'Promotion',
      daysLeft: calculateDaysLeft(offer.startDate, offer.endDate),
    })),
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

module.exports = { getSiteContent };
