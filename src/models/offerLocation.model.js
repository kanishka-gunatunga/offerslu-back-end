'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class OfferLocation extends Model {}

  OfferLocation.init(
    {
      offerId: { type: DataTypes.UUID, primaryKey: true },
      locationId: { type: DataTypes.UUID, primaryKey: true },
    },
    {
      sequelize,
      modelName: 'OfferLocation',
      tableName: 'offer_locations',
      indexes: [{ fields: ['offer_id'] }, { fields: ['location_id'] }],
    }
  );

  return OfferLocation;
};
