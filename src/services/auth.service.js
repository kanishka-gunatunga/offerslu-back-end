'use strict';

const crypto = require('crypto');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
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

const login = async ({ password }) => {
  const user = await User.findOne({ where: { email: env.admin.email, isActive: true } });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('INVALID_CREDENTIALS');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('INVALID_CREDENTIALS');
  }

  const rawToken = generateToken();
  const expiresAt = new Date(Date.now() + env.admin.sessionTtlSeconds * 1000);

  await AdminSession.create({
    adminUserId: user.id,
    tokenHash: sha256(rawToken),
    expiresAt,
  });

  user.lastLoginAt = new Date();
  await user.save();

  return { sessionToken: rawToken };
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
