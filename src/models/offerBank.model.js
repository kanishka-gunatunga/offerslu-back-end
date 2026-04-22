'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class OfferBank extends Model {}

  OfferBank.init(
    {
      offerId: { type: DataTypes.UUID, primaryKey: true },
      bankId: { type: DataTypes.UUID, primaryKey: true },
    },
    {
      sequelize,
      modelName: 'OfferBank',
      tableName: 'offer_banks',
      indexes: [{ fields: ['offer_id'] }, { fields: ['bank_id'] }],
    }
  );

  return OfferBank;
};
