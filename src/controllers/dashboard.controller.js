'use strict';

const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const { Offer, Merchant, Category } = require('../models');

const stats = asyncHandler(async (_req, res) => {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    totalOffers,
    activeOffers,
    inactiveOffers,
    expiredOffers,
    expiringSoon,
    totalMerchants,
    totalCategories,
  ] = await Promise.all([
    Offer.count(),
    Offer.count({ where: { status: 'active' } }),
    Offer.count({ where: { status: 'inactive' } }),
    Offer.count({ where: { expiryDate: { [Op.lt]: now } } }),
    Offer.count({ where: { expiryDate: { [Op.between]: [now, in7Days] } } }),
    Merchant.count(),
    Category.count(),
  ]);

  return apiResponse.success(res, {
    data: {
      offers: {
        total: totalOffers,
        active: activeOffers,
        inactive: inactiveOffers,
        expired: expiredOffers,
        expiringSoon,
      },
      merchants: { total: totalMerchants },
      categories: { total: totalCategories },
    },
  });
});

module.exports = { stats };
