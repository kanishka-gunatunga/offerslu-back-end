'use strict';

const logger = require('../config/logger');

/** Max age (seconds) shared caches may hold public JSON; browsers stay fresh via max-age=0. */
const S_MAXAGE = 30;
const STALE_WHILE_REVALIDATE = 120;

/**
 * Short Cache-Control for GET /public/* so CDN/Vercel edge can absorb SSR bursts without
 * stale data for long (admin revalidate + low s-maxage).
 */
const publicCacheHeaders = (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  res.setHeader(
    'Cache-Control',
    `public, max-age=0, s-maxage=${S_MAXAGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`
  );
  next();
};

const SLOW_PUBLIC_MS = 2000;

/**
 * Log latency and status for every public route (observability / correlation with admin writes).
 */
const observePublicRoute = (req, res, next) => {
  const start = Date.now();
  const pathOnly = (req.originalUrl || req.url || '').split('?')[0] || req.path;

  res.on('finish', () => {
    const ms = Date.now() - start;
    const payload = {
      event: 'public_route',
      path: pathOnly,
      method: req.method,
      statusCode: res.statusCode,
      ms,
      ...(ms >= SLOW_PUBLIC_MS ? { slow: true } : {}),
    };
    const line = JSON.stringify(payload);
    if (res.statusCode >= 500) logger.error(line);
    else if (res.statusCode >= 400) logger.warn(line);
    else if (ms >= SLOW_PUBLIC_MS) logger.warn(`slow_public_route ${line}`);
    else logger.info(line);
  });

  next();
};

module.exports = { publicCacheHeaders, observePublicRoute };
