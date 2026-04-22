'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Bank extends Model {}

  Bank.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(120), allowNull: false, validate: { notEmpty: true } },
      logoUrl: { type: DataTypes.STRING(600), allowNull: true },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      sequelize,
      modelName: 'Bank',
      tableName: 'banks',
      indexes: [{ fields: ['status'] }, { fields: ['name'] }],
    }
  );

  return Bank;
};
