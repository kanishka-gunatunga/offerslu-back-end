'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Payment extends Model {}

  Payment.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(120), allowNull: false, validate: { notEmpty: true } },
      parentId: { type: DataTypes.UUID, allowNull: true },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      sequelize,
      modelName: 'Payment',
      tableName: 'payments',
      indexes: [{ fields: ['parent_id'] }, { fields: ['status'] }, { fields: ['name'] }],
    }
  );

  return Payment;
};
