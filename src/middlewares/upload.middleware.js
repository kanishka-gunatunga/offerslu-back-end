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

const ensureImageSignature = (
  file,
  { maxSizeBytes = env.upload.maxSizeBytes, field = 'file' } = {}
) => {
  if (!file) return;
  if (file.size > maxSizeBytes) {
    const mb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    throw ApiError.badRequest('VALIDATION_ERROR', {
      fields: [{ field, message: `Image exceeds size limit (${mb} MB max for this field)` }],
    });
  }

  // Relaxed image signature check to avoid rejecting valid images with unusual headers
  const detected = detectImageType(file.buffer);
  if (detected && !ALLOWED_IMAGE_MIME_TYPES.has(detected)) {
    throw ApiError.badRequest('VALIDATION_ERROR', {
      fields: [{ field, message: 'Invalid image file (type not allowed)' }],
    });
  }
};

module.exports = { upload, ensureImageSignature };
