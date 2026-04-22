'use strict';

const { SiteContent, Category, Bank, Offer } = require('../models');

const fallbackSiteContent = async () => {
  const [categories, banks, promotions] = await Promise.all([
    Category.findAll({
      where: { status: 'active', parentId: null },
      order: [['name', 'ASC']],
      limit: 20,
    }),
    Bank.findAll({ where: { status: 'active' }, order: [['name', 'ASC']], limit: 20 }),
    Offer.findAll({ where: { isInactive: false }, order: [['startDate', 'DESC']], limit: 20 }),
  ]);

  return {
    siteName: 'Offerlu',
    hero: {},
    categories: categories.map((item) => ({
      id: item.id,
      name: item.name,
      bannerImageUrl: item.bannerImageUrl,
    })),
    promotionSections: [],
    promotions: promotions.map((offer) => ({
      id: offer.id,
      title: offer.title,
      heroImageUrl: offer.heroImageUrl,
      startDate: offer.startDate,
      endDate: offer.endDate,
      companyName: offer.companyName,
    })),
    banks: banks.map((bank) => ({ id: bank.id, name: bank.name, logoUrl: bank.logoUrl })),
    about: {},
    socialLinks: [],
  };
};

const getSiteContent = async () => {
  const content = await SiteContent.findOne({ where: { isDefault: true } });
  if (content) {
    return {
      siteName: content.siteName,
      hero: content.hero,
      categories: content.categories,
      promotionSections: content.promotionSections,
      promotions: content.promotions,
      banks: content.banks,
      about: content.about,
      socialLinks: content.socialLinks,
    };
  }
  return fallbackSiteContent();
};

module.exports = { getSiteContent };
