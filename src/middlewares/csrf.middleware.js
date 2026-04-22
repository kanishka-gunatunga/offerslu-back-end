'use strict';

const { URL } = require('node:url');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const sanitizeOrigin = (value) =>
  typeof value === 'string' ? value.trim().replace(/\/$/, '') : '';

const buildAllowedOrigins = () => {
  const allowed = new Set();

  if (env.corsOrigin !== '*') {
    env.corsOrigin
      .split(',')
      .map(sanitizeOrigin)
      .filter(Boolean)
      .forEach((origin) => allowed.add(origin));
  }

  env.trustedOrigins
    .map(sanitizeOrigin)
    .filter(Boolean)
    .forEach((origin) => allowed.add(origin));
  return allowed;
};

const allowedOrigins = buildAllowedOrigins();

const verifyAdminOrigin = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  if (allowedOrigins.size === 0) return next();

  const origin = sanitizeOrigin(req.get('origin'));
  const referer = sanitizeOrigin(req.get('referer'));
  let refererOrigin = '';
  if (referer) {
    try {
      refererOrigin = new URL(referer).origin;
    } catch {
      refererOrigin = '';
    }
  }

  if (allowedOrigins.has(origin) || (refererOrigin && allowedOrigins.has(refererOrigin))) {
    return next();
  }

  return next(ApiError.forbidden('CSRF_ORIGIN_REJECTED'));
};

module.exports = { verifyAdminOrigin };
