'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class SiteContent extends Model {}

  SiteContent.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      siteName: { type: DataTypes.STRING(160), allowNull: false, defaultValue: 'Offerlu' },
      hero: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      categories: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      promotionSections: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      promotions: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      banks: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      about: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      socialLinks: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      modelName: 'SiteContent',
      tableName: 'site_contents',
      indexes: [{ unique: true, fields: ['is_default'] }],
    }
  );

  return SiteContent;
};
