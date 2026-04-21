'use strict';

const Joi = require('joi');

const login = {
  body: Joi.object({
    username: Joi.string().trim().min(3).max(64).required(),
    password: Joi.string().min(6).max(128).required(),
  }),
};

const changePassword = {
  body: Joi.object({
    currentPassword: Joi.string().min(6).max(128).required(),
    newPassword: Joi.string()
      .min(6)
      .max(128)
      .invalid(Joi.ref('currentPassword'))
      .required()
      .messages({
        'any.invalid': 'New password must be different from the current password',
      }),
  }),
};

module.exports = { login, changePassword };
