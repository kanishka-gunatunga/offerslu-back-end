'use strict';

const { ValidationError, UniqueConstraintError, DatabaseError } = require('sequelize');
const multer = require('multer');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const env = require('../config/env');

const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (error instanceof UniqueConstraintError) {
    error = ApiError.conflict('Resource already exists', {
      fields: error.errors?.map((e) => ({ field: e.path, message: e.message })),
    });
  } else if (error instanceof ValidationError) {
    error = ApiError.badRequest('Validation failed', {
      fields: error.errors?.map((e) => ({ field: e.path, message: e.message })),
    });
  } else if (error instanceof DatabaseError) {
    error = ApiError.internal('Database error');
  } else if (error instanceof multer.MulterError) {
    error = ApiError.badRequest(`Upload error: ${error.message}`);
  } else if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    error = new ApiError(
      statusCode,
      error.message || 'Internal Server Error',
      undefined,
      statusCode < 500
    );
  }

  const logMeta = {
    method: req.method,
    url: req.originalUrl,
    status: error.statusCode,
  };

  if (error.statusCode >= 500) {
    logger.error(`${error.message} ${JSON.stringify(logMeta)}\n${err.stack || ''}`);
  } else {
    logger.warn(`${error.message} ${JSON.stringify(logMeta)}`);
  }

  const body = {
    error: {
      code: error.message || 'INTERNAL_ERROR',
      message: error.message || 'Internal Server Error',
    },
  };
  if (error.details?.fields) {
    body.error.fields = error.details.fields.reduce((acc, item) => {
      if (item.field) acc[item.field] = item.message;
      return acc;
    }, {});
  }
  if (!env.isProd && err.stack) body.error.stack = err.stack;

  res.status(error.statusCode).json(body);
};

module.exports = { notFoundHandler, errorHandler };
