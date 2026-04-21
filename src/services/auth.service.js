'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { User } = require('../models');

const signToken = (user) =>
  jwt.sign({ sub: user.id, username: user.username, role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });

const login = async ({ username, password }) => {
  const user = await User.findOne({ where: { username } });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid username or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid username or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  return {
    token: signToken(user),
    expiresIn: env.jwt.expiresIn,
    user: user.toJSON(),
  };
};

const changePassword = async (user, { currentPassword, newPassword }) => {
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  return { success: true };
};

module.exports = { login, changePassword };
