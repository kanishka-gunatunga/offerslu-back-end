'use strict';

const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Model {
    async comparePassword(plain) {
      return bcrypt.compare(plain, this.passwordHash);
    }

    toJSON() {
      const values = { ...this.get() };
      delete values.passwordHash;
      return values;
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true, isEmail: true, len: [6, 255] },
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'AdminUser',
      tableName: 'admin_users',
      indexes: [{ unique: true, fields: ['email'] }, { fields: ['is_active'] }],
      hooks: {
        beforeCreate: async (user) => {
          if (user.passwordHash) {
            user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('passwordHash')) {
            user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
          }
        },
      },
    }
  );

  return User;
};
