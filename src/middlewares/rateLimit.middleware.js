'use strict';

const crypto = require('crypto');
const { URL } = require('node:url');
const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * Pathname for matching (handles proxies / originalUrl with query string).
 * @param {import('express').Request} req
 */
const requestPathname = (req) => {
  const raw = req.originalUrl || req.url || '';
  try {
    return new URL(raw, `http://${req.headers.host || 'localhost'}`).pathname || '';
  } catch {
    return typeof req.path === 'string' ? req.path : '';
  }
};

const hashClientBucket = (req) => {
  const ip = req.ip || req.socket?.remoteAddress || '';
  return crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 16);
};

const login429Handler = (req, res, _next, options) => {
  const retryAfterSec = Math.max(1, Math.ceil(options.windowMs / 1000));
  res.setHeader('Retry-After', String(retryAfterSec));
  logger.warn('rate_limit_429_login', {
    path: requestPathname(req),
    method: req.method,
    clientKeyHash: hashClientBucket(req),
  });
  res.status(429).json({
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many login attempts. Please try again later.',
      retryAfterSeconds: retryAfterSec,
    },
  });
};

const json429Handler = (logEvent) => (req, res, _next, options) => {
  const retryAfterSec = Math.max(1, Math.ceil(options.windowMs / 1000));
  res.setHeader('Retry-After', String(retryAfterSec));
  logger.warn(logEvent, {
    path: requestPathname(req),
    method: req.method,
    clientKeyHash: hashClientBucket(req),
  });
  res.status(429).json({
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
      retryAfterSeconds: retryAfterSec,
    },
  });
};

/**
 * Cheap read paths that should not share the global bucket with SSR-heavy traffic.
 * Keys: same as express-rate-limit default — **per IP** (see README).
 * @param {string} apiPrefixNorm e.g. /api or /api/v1
 */
const skipGlobalLimiterForPublicReads = (apiPrefixNorm) => (req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  const p = requestPathname(req);
  const publicPrefix = `${apiPrefixNorm}/public`;
  const healthPath = `${apiPrefixNorm}/health`;
  if (p === healthPath) return true;
  if (p.startsWith(`${publicPrefix}/`) || p === publicPrefix) return true;
  if (p.startsWith('/uploads/')) return true;
  return false;
};

const createGlobalLimiter = (env) => {
  const apiPrefixNorm = env.apiPrefix.replace(/\/$/, '') || env.apiPrefix;
  return rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipGlobalLimiterForPublicReads(apiPrefixNorm),
    handler: json429Handler('rate_limit_429'),
  });
};

/** Stricter cap for admin mutations only (POST / PATCH / PUT / DELETE). */
const createAdminWriteLimiter = (env) =>
  rateLimit({
    windowMs: env.rateLimit.adminWriteWindowMs,
    max: env.rateLimit.adminWriteMax,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => !['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method),
    handler: json429Handler('rate_limit_429_admin_write'),
  });

const createLoginLimiter = (env) =>
  rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.loginMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: login429Handler,
  });

module.exports = {
  createGlobalLimiter,
  createAdminWriteLimiter,
  createLoginLimiter,
  requestPathname,
};
