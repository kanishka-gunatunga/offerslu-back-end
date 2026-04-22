'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Location extends Model {}

  Location.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(120), allowNull: false, validate: { notEmpty: true } },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      sequelize,
      modelName: 'Location',
      tableName: 'locations',
      indexes: [{ fields: ['status'] }, { fields: ['name'] }],
    }
  );

  return Location;
};
