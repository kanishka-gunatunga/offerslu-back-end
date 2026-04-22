'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class OfferPayment extends Model {}

  OfferPayment.init(
    {
      offerId: { type: DataTypes.UUID, primaryKey: true },
      paymentId: { type: DataTypes.UUID, primaryKey: true },
    },
    {
      sequelize,
      modelName: 'OfferPayment',
      tableName: 'offer_payments',
      indexes: [{ fields: ['offer_id'] }, { fields: ['payment_id'] }],
    }
  );

  return OfferPayment;
};
