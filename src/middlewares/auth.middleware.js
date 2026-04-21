'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { User } = require('../models');

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return null;
};

const authenticate = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw ApiError.unauthorized('Authentication token missing');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Token expired');
      }
      throw ApiError.unauthorized('Invalid authentication token');
    }

    const user = await User.findByPk(decoded.sub);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate };
