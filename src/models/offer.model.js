'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Offer extends Model {}

  Offer.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: { notEmpty: true, len: [1, 200] },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true },
      },
      merchantId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      expiryDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      attachmentPath: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      attachmentName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      attachmentMimeType: {
        type: DataTypes.STRING(150),
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
      modelName: 'Offer',
      tableName: 'offers',
      indexes: [
        { fields: ['title'] },
        { fields: ['expiry_date'] },
        { fields: ['merchant_id'] },
        { fields: ['status'] },
      ],
    }
  );

  return Offer;
};
