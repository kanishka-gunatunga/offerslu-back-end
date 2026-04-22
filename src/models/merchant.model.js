'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Merchant extends Model {}

  Merchant.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(160),
        allowNull: false,
        validate: { notEmpty: true, len: [1, 160] },
      },
      parentId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      logoUrl: {
        type: DataTypes.STRING(600),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      sequelize,
      modelName: 'Merchant',
      tableName: 'merchants',
      indexes: [{ fields: ['parent_id'] }, { fields: ['status'] }, { fields: ['name'] }],
    }
  );

  return Merchant;
};
