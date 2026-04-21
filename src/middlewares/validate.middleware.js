'use strict';

const ApiError = require('../utils/ApiError');

const pick = (obj, keys) =>
  keys.reduce((acc, key) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});

/**
 * Validates req[body|query|params] against a Joi schema object.
 * Example: validate({ body: Joi.object({...}), query: Joi.object({...}) })
 */
const validate = (schema) => (req, _res, next) => {
  const validKeys = ['params', 'query', 'body'];
  const target = pick(schema, validKeys);
  const toValidate = pick(req, Object.keys(target));

  const compiled = require('joi')
    .object(target)
    .prefs({ abortEarly: false, stripUnknown: true, convert: true });

  const { value, error } = compiled.validate(toValidate);

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    return next(ApiError.badRequest('Validation failed', { fields: details }));
  }

  Object.assign(req, value);
  return next();
};

module.exports = { validate };
