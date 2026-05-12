'use strict';

const path = require('path');
const os = require('os');
const dotenv = require('dotenv');
const Joi = require('joi');

/**
 * Writable root for new uploads. On Vercel the deploy tree is read-only, so defaults to /tmp/...
 * Committed images in ./uploads are still served (see app.js read order).
 */
const defaultUploadDir =
  process.env.VERCEL === '1' ? path.join(os.tmpdir(), 'offerslu-uploads') : 'uploads';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(4000),
  API_PREFIX: Joi.string().default('/api'),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_DIALECT: Joi.string().valid('mysql').default('mysql'),
  DB_LOGGING: Joi.boolean().default(false),

  ADMIN_SESSION_TTL_SECONDS: Joi.number().default(60 * 60 * 24 * 7),
  ADMIN_COOKIE_NAME: Joi.string().default('offerlu_admin_session'),

  CORS_ORIGIN: Joi.string().default('*'),
  TRUSTED_ORIGINS: Joi.string().allow('').default(''),

  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000),
  /** Global limit (per IP). Public GETs under `${API_PREFIX}/public/*`, `${API_PREFIX}/health`, and GET `/uploads/*` are exempt — see rateLimit middleware. */
  RATE_LIMIT_MAX: Joi.number().default(3000),
  /** Max admin write requests (POST/PATCH/PUT/DELETE) per window per IP on `/admin/offers` and `/admin/master-data`. */
  RATE_LIMIT_MAX_ADMIN_WRITE: Joi.number().default(200),
  RATE_LIMIT_ADMIN_WRITE_WINDOW_MS: Joi.number().default(15 * 60 * 1000),
  LOGIN_RATE_LIMIT_MAX: Joi.number().default(10),

  UPLOAD_DIR: Joi.string().default(defaultUploadDir),
  MAX_UPLOAD_SIZE_MB: Joi.number().default(10),
  HERO_IMAGE_MAX_SIZE_MB: Joi.number().default(5),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'debug').default('info'),

  /** Optional. Full origin of this API (e.g. https://api-xx.vercel.app) so image URLs work from a separate frontend host. */
  PUBLIC_ASSET_BASE_URL: Joi.string().trim().allow('').default(''),
}).unknown(true);

const { value: env, error } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
  console.error('Invalid environment configuration:', error.message);
  process.exit(1);
}

module.exports = {
  nodeEnv: env.NODE_ENV,
  isProd: env.NODE_ENV === 'production',
  port: env.PORT,
  apiPrefix: env.API_PREFIX,

  db: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    dialect: env.DB_DIALECT,
    logging: env.DB_LOGGING,
  },

  admin: {
    sessionTtlSeconds: env.ADMIN_SESSION_TTL_SECONDS,
    cookieName: env.ADMIN_COOKIE_NAME,
  },

  corsOrigin: env.CORS_ORIGIN,
  trustedOrigins: env.TRUSTED_ORIGINS
    ? env.TRUSTED_ORIGINS.split(',').map((origin) => origin.trim())
    : [],

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    adminWriteMax: env.RATE_LIMIT_MAX_ADMIN_WRITE,
    adminWriteWindowMs: env.RATE_LIMIT_ADMIN_WRITE_WINDOW_MS,
    loginMax: env.LOGIN_RATE_LIMIT_MAX,
  },

  upload: {
    dir: env.UPLOAD_DIR,
    /** Where multer/fs writes new files (tmp on Vercel, ./uploads locally). */
    writeRoot: path.resolve(process.cwd(), env.UPLOAD_DIR),
    /** Bundled repo folder (read-only on Vercel); used to serve images shipped with git. */
    bundleRoot: path.resolve(process.cwd(), 'uploads'),
    maxSizeBytes: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
    heroImageMaxSizeBytes: env.HERO_IMAGE_MAX_SIZE_MB * 1024 * 1024,
  },

  logLevel: env.LOG_LEVEL,

  publicAssetBaseUrl: env.PUBLIC_ASSET_BASE_URL || '',
};
