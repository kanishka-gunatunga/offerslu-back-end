'use strict';

const success = (res, { statusCode = 200, message = 'Success', data = null, meta } = {}) => {
  const payload = { success: true, message, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

const created = (res, payload = {}) =>
  success(res, { statusCode: 201, message: 'Created', ...payload });

const noContent = (res) => res.status(204).send();

module.exports = { success, created, noContent };
