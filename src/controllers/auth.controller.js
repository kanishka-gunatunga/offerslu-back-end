'use strict';

const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');
const env = require('../config/env');

const login = asyncHandler(async (req, res) => {
  const { sessionToken } = await authService.login(req.body);
  res.cookie(env.admin.cookieName, sessionToken, authService.sessionCookieOptions);
  return res.status(204).send();
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.adminSession?.id);
  res.clearCookie(env.admin.cookieName, { ...authService.sessionCookieOptions, maxAge: undefined });
  return res.status(204).send();
});

const session = asyncHandler(async (_req, res) => res.status(200).json({ authenticated: true }));
const sessionState = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.admin.cookieName];
  const session = await authService.getSessionByToken(token);
  if (!session) {
    return res.status(401).json({ authenticated: false });
  }
  return res.status(200).json({ authenticated: true });
});

module.exports = { login, logout, session, sessionState };
