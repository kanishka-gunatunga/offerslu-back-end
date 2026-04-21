'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class OfferCategory extends Model {}

  OfferCategory.init(
    {
      offerId: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
      },
      categoryId: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
      },
    },
    {
      sequelize,
      modelName: 'OfferCategory',
      tableName: 'offer_categories',
      timestamps: false,
    }
  );

  return OfferCategory;
};
