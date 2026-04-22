'use strict';

const ApiError = require('./ApiError');

const parseIdArrayField = (body, key) => {
  const direct = body[key];
  const bracketed = body[`${key}[]`];
  const value = direct !== undefined ? direct : bracketed;

  if (value === undefined || value === null) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    if (value.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        // ignore and continue with comma parser
      }
    }
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const requireNonEmptyArray = (items, fieldName) => {
  if (!Array.isArray(items) || items.length < 1) {
    throw ApiError.badRequest('VALIDATION_ERROR', {
      fields: [{ field: fieldName, message: 'Required' }],
    });
  }
};

module.exports = { parseIdArrayField, requireNonEmptyArray };
