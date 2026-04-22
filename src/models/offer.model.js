'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Offer extends Model {}

  Offer.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { notEmpty: true, len: [1, 255] },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true },
      },
      heroImageUrl: {
        type: DataTypes.STRING(600),
        allowNull: false,
      },
      companyName: {
        type: DataTypes.STRING(160),
        allowNull: false,
      },
      companyLogoUrl: {
        type: DataTypes.STRING(600),
        allowNull: true,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      isInactive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Offer',
      tableName: 'offers',
      indexes: [
        { fields: ['title'] },
        { fields: ['company_name'] },
        { fields: ['start_date'] },
        { fields: ['end_date'] },
        { fields: ['is_inactive'] },
      ],
    }
  );

  return Offer;
};
