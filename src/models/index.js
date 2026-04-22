'use strict';

const { sequelize } = require('../config/database');

const User = require('./user.model')(sequelize);
const AdminSession = require('./adminSession.model')(sequelize);
const OfferType = require('./offerType.model')(sequelize);
const Category = require('./category.model')(sequelize);
const Merchant = require('./merchant.model')(sequelize);
const Payment = require('./payment.model')(sequelize);
const Bank = require('./bank.model')(sequelize);
const Location = require('./location.model')(sequelize);
const Offer = require('./offer.model')(sequelize);
const OfferOfferType = require('./offerOfferType.model')(sequelize);
const OfferCategory = require('./offerCategory.model')(sequelize);
const OfferMerchant = require('./offerMerchant.model')(sequelize);
const OfferPayment = require('./offerPayment.model')(sequelize);
const OfferBank = require('./offerBank.model')(sequelize);
const OfferLocation = require('./offerLocation.model')(sequelize);
const SiteContent = require('./siteContent.model')(sequelize);

User.hasMany(AdminSession, { foreignKey: 'adminUserId', as: 'sessions' });
AdminSession.belongsTo(User, { foreignKey: 'adminUserId', as: 'adminUser' });

OfferType.belongsTo(OfferType, { foreignKey: 'parentId', as: 'parent' });
OfferType.hasMany(OfferType, { foreignKey: 'parentId', as: 'children' });

Category.belongsTo(Category, { foreignKey: 'parentId', as: 'parent' });
Category.hasMany(Category, { foreignKey: 'parentId', as: 'children' });

Merchant.belongsTo(Merchant, { foreignKey: 'parentId', as: 'parent' });
Merchant.hasMany(Merchant, { foreignKey: 'parentId', as: 'children' });

Payment.belongsTo(Payment, { foreignKey: 'parentId', as: 'parent' });
Payment.hasMany(Payment, { foreignKey: 'parentId', as: 'children' });

Offer.belongsToMany(OfferType, {
  through: OfferOfferType,
  foreignKey: 'offerId',
  otherKey: 'offerTypeId',
  as: 'offerTypes',
});
OfferType.belongsToMany(Offer, {
  through: OfferOfferType,
  foreignKey: 'offerTypeId',
  otherKey: 'offerId',
  as: 'offers',
});

Offer.belongsToMany(Category, {
  through: OfferCategory,
  foreignKey: 'offerId',
  otherKey: 'categoryId',
  as: 'categories',
});
Category.belongsToMany(Offer, {
  through: OfferCategory,
  foreignKey: 'categoryId',
  otherKey: 'offerId',
  as: 'offers',
});

Offer.belongsToMany(Merchant, {
  through: OfferMerchant,
  foreignKey: 'offerId',
  otherKey: 'merchantId',
  as: 'merchants',
});
Merchant.belongsToMany(Offer, {
  through: OfferMerchant,
  foreignKey: 'merchantId',
  otherKey: 'offerId',
  as: 'offers',
});

Offer.belongsToMany(Payment, {
  through: OfferPayment,
  foreignKey: 'offerId',
  otherKey: 'paymentId',
  as: 'payments',
});
Payment.belongsToMany(Offer, {
  through: OfferPayment,
  foreignKey: 'paymentId',
  otherKey: 'offerId',
  as: 'offers',
});

Offer.belongsToMany(Bank, {
  through: OfferBank,
  foreignKey: 'offerId',
  otherKey: 'bankId',
  as: 'banks',
});
Bank.belongsToMany(Offer, {
  through: OfferBank,
  foreignKey: 'bankId',
  otherKey: 'offerId',
  as: 'offers',
});

Offer.belongsToMany(Location, {
  through: OfferLocation,
  foreignKey: 'offerId',
  otherKey: 'locationId',
  as: 'locations',
});
Location.belongsToMany(Offer, {
  through: OfferLocation,
  foreignKey: 'locationId',
  otherKey: 'offerId',
  as: 'offers',
});

module.exports = {
  sequelize,
  User,
  AdminSession,
  OfferType,
  Category,
  Merchant,
  Payment,
  Bank,
  Location,
  Offer,
  OfferOfferType,
  OfferCategory,
  OfferMerchant,
  OfferPayment,
  OfferBank,
  OfferLocation,
  SiteContent,
};
