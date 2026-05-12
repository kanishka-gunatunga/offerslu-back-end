'use strict';

const crypto = require('crypto');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const { AdminSession, User } = require('../models');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const generateToken = () => crypto.randomBytes(48).toString('base64url');

const sessionCookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'lax',
  path: '/',
  maxAge: env.admin.sessionTtlSeconds * 1000,
};

const isDbConnectivityError = (err) => {
  if (!err || typeof err !== 'object') return false;
  const name = String(err.name || '');
  const code = String(err.code || '');
  const parent = err.parent;
  const parentCode = parent && String(parent.code || '');
  if (/SequelizeConnection|SequelizeTimeout|SequelizeHostNotFound/i.test(name)) return true;
  if (['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'PROTOCOL_CONNECTION_LOST'].includes(code))
    return true;
  if (['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST'].includes(parentCode)) return true;
  return false;
};

const login = async ({ password }) => {
  try {
    const users = await User.findAll({
      where: { isActive: true },
      order: [['createdAt', 'ASC']],
    });

    if (!users.length) {
      logger.warn('admin_login_failed', { reason: 'no_active_admin_user' });
      throw ApiError.unauthorized('INVALID_CREDENTIALS');
    }

    let matched = null;
    for (const user of users) {
      if (await user.comparePassword(password)) {
        matched = user;
        break;
      }
    }

    if (!matched) {
      logger.warn('admin_login_failed', {
        reason: 'password_mismatch',
        candidatesChecked: users.length,
      });
      throw ApiError.unauthorized('INVALID_CREDENTIALS');
    }

    const rawToken = generateToken();
    const expiresAt = new Date(Date.now() + env.admin.sessionTtlSeconds * 1000);

    await AdminSession.create({
      adminUserId: matched.id,
      tokenHash: sha256(rawToken),
      expiresAt,
    });

    matched.lastLoginAt = new Date();
    await matched.save();

    return { sessionToken: rawToken };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    logger.error(`admin_login_error ${err.message}\n${err.stack || ''}`);
    if (isDbConnectivityError(err)) {
      throw ApiError.serviceUnavailable(
        'Cannot reach the database. Check DB_HOST / network / Vercel env and try again.'
      );
    }
    throw err;
  }
};

const getSessionByToken = async (sessionToken) => {
  if (!sessionToken) return null;
  const session = await AdminSession.findOne({
    where: { tokenHash: sha256(sessionToken) },
    include: [{ model: User, as: 'adminUser' }],
  });

  if (
    !session ||
    session.revokedAt ||
    !session.adminUser ||
    !session.adminUser.isActive ||
    session.expiresAt.getTime() <= Date.now()
  ) {
    return null;
  }

  return session;
};

const logout = async (sessionId) => {
  if (!sessionId) return;
  const existing = await AdminSession.findByPk(sessionId);
  if (existing && !existing.revokedAt) {
    existing.revokedAt = new Date();
    await existing.save();
  }
};

module.exports = { login, logout, getSessionByToken, sessionCookieOptions };
