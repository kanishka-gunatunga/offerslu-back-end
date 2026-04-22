'use strict';

const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { detectImageType } = require('../utils/fileSignature');

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
  }
  return cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: env.upload.maxSizeBytes },
});

const ensureImageSignature = (file, { maxSizeBytes = env.upload.maxSizeBytes } = {}) => {
  if (!file) return;
  if (file.size > maxSizeBytes) {
    throw ApiError.badRequest('Image exceeds size limit');
  }

  const detected = detectImageType(file.buffer);
  if (!detected || !ALLOWED_IMAGE_MIME_TYPES.has(detected)) {
    throw ApiError.badRequest('Invalid image signature');
  }
};

module.exports = { upload, ensureImageSignature };
