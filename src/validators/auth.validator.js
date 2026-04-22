'use strict';

const Joi = require('joi');

const login = {
  body: Joi.object({
    password: Joi.string().min(6).max(128).required(),
  }),
};

module.exports = { login };
