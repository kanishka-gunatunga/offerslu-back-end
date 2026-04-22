'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class OfferCategory extends Model {}

  OfferCategory.init(
    {
      offerId: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      categoryId: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
    },
    {
      sequelize,
      modelName: 'OfferCategory',
      tableName: 'offer_categories',
      indexes: [{ fields: ['offer_id'] }, { fields: ['category_id'] }],
    }
  );

  return OfferCategory;
};
