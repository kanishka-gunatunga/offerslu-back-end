'use strict';

const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const authService = require('../services/auth.service');

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return apiResponse.success(res, {
    message: 'Login successful',
    data: result,
  });
});

const me = asyncHandler(async (req, res) =>
  apiResponse.success(res, {
    message: 'Current user',
    data: { user: req.user.toJSON() },
  })
);

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user, req.body);
  return apiResponse.success(res, { message: 'Password updated successfully' });
});

const logout = asyncHandler(async (_req, res) =>
  // Stateless JWT; clients should discard the token.
  apiResponse.success(res, { message: 'Logged out' })
);

module.exports = { login, me, changePassword, logout };
