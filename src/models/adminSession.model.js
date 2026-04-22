'use strict';

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class AdminSession extends Model {}

  AdminSession.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      adminUserId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      tokenHash: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      revokedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'AdminSession',
      tableName: 'admin_sessions',
      indexes: [{ fields: ['admin_user_id'] }, { fields: ['expires_at'] }],
    }
  );

  return AdminSession;
};
