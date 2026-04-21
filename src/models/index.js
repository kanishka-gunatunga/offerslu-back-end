'use strict';

const { sequelize } = require('../config/database');

const User = require('./user.model')(sequelize);
const Category = require('./category.model')(sequelize);
const Merchant = require('./merchant.model')(sequelize);
const Offer = require('./offer.model')(sequelize);
const OfferCategory = require('./offerCategory.model')(sequelize);

Merchant.hasMany(Offer, { foreignKey: 'merchantId', as: 'offers' });
Offer.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });

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

module.exports = {
  sequelize,
  User,
  Category,
  Merchant,
  Offer,
  OfferCategory,
};
