'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class OfferMerchant extends Model {}

  OfferMerchant.init(
    {
      offerId: { type: DataTypes.UUID, primaryKey: true },
      merchantId: { type: DataTypes.UUID, primaryKey: true },
    },
    {
      sequelize,
      modelName: 'OfferMerchant',
      tableName: 'offer_merchants',
      indexes: [{ fields: ['offer_id'] }, { fields: ['merchant_id'] }],
    }
  );

  return OfferMerchant;
};
