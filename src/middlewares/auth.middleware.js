'use strict';

const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const authService = require('../services/auth.service');
const logger = require('../config/logger');

const getSessionToken = (req) => req.cookies?.[env.admin.cookieName] || null;

const authenticate = async (req, _res, next) => {
  try {
    const sessionToken = getSessionToken(req);
    if (!sessionToken) {
      logger.warn('Admin UNAUTHENTICATED: session cookie absent', {
        cookieName: env.admin.cookieName,
        method: req.method,
        path: req.originalUrl || req.path,
      });
      throw ApiError.unauthorized('UNAUTHENTICATED');
    }

    const session = await authService.getSessionByToken(sessionToken);
    if (!session) {
      logger.warn('Admin UNAUTHENTICATED: session cookie present but not valid', {
        cookieName: env.admin.cookieName,
        method: req.method,
        path: req.originalUrl || req.path,
        reason:
          'no matching row, revoked, expired, inactive user, or token mismatch (session validation failed)',
      });
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
