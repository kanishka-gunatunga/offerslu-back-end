'use strict';

const hasField = (body, key) =>
  Object.prototype.hasOwnProperty.call(body || {}, key) ||
  Object.prototype.hasOwnProperty.call(body || {}, `${key}[]`);

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

const parseOptionalIdArrayField = (body, key) => {
  if (!hasField(body, key)) return null;
  return parseIdArrayField(body, key);
};

module.exports = { parseIdArrayField, parseOptionalIdArrayField, hasField };
