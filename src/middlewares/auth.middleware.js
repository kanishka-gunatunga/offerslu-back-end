'use strict';

const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const authService = require('../services/auth.service');

const getSessionToken = (req) => req.cookies?.[env.admin.cookieName] || null;

const authenticate = async (req, _res, next) => {
  try {
    const sessionToken = getSessionToken(req);
    if (!sessionToken) {
      throw ApiError.unauthorized('UNAUTHENTICATED');
    }

    const session = await authService.getSessionByToken(sessionToken);
    if (!session) {
      throw ApiError.unauthorized('UNAUTHENTICATED');
    }

    req.user = session.adminUser;
    req.adminSession = session;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate };
