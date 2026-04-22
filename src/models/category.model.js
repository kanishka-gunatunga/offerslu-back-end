'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Category extends Model {}

  Category.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: { notEmpty: true, len: [1, 120] },
      },
      parentId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      bannerImageUrl: {
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
      modelName: 'Category',
      tableName: 'categories',
      indexes: [{ fields: ['parent_id'] }, { fields: ['status'] }, { fields: ['name'] }],
    }
  );

  return Category;
};
