'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class OfferOfferType extends Model {}

  OfferOfferType.init(
    {
      offerId: { type: DataTypes.UUID, primaryKey: true },
      offerTypeId: { type: DataTypes.UUID, primaryKey: true },
    },
    {
      sequelize,
      modelName: 'OfferOfferType',
      tableName: 'offer_offer_types',
      indexes: [{ fields: ['offer_id'] }, { fields: ['offer_type_id'] }],
    }
  );

  return OfferOfferType;
};
