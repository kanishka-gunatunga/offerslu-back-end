'use strict';

const env = require('../config/env');

/**
 * Prefix relative asset paths (e.g. /uploads/...) with the public API origin when
 * the frontend is on another domain (set PUBLIC_ASSET_BASE_URL on Vercel).
 */
const toAbsoluteAssetUrl = (url) => {
  if (url == null || url === '') {
    return url;
  }
  if (typeof url !== 'string') return url;
  if (/^https?:\/\//i.test(url)) return url;

  const base = env.publicAssetBaseUrl;
  if (!base) return url;

  const trimmedBase = base.replace(/\/$/, '');
  const pathPart = url.startsWith('/') ? url : `/${url}`;
  return `${trimmedBase}${pathPart}`;
};

module.exports = { toAbsoluteAssetUrl };
