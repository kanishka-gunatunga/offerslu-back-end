'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const env = require('../config/env');

const uploadRoot = path.resolve(process.cwd(), env.upload.dir);

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const fileExt = (mimeType) => {
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  if (mimeType === 'image/gif') return '.gif';
  return '.bin';
};

const saveImage = async ({ entity, entityId, file }) => {
  const dir = path.join(uploadRoot, entity, entityId);
  await ensureDir(dir);

  const filename = `${crypto.randomUUID()}${fileExt(file.mimetype)}`;
  const absolutePath = path.join(dir, filename);
  await fs.writeFile(absolutePath, file.buffer);

  const relativeUrl = [env.upload.dir, entity, entityId, filename].join('/').replace(/\\/g, '/');
  return { absolutePath, relativeUrl: `/${relativeUrl}` };
};

const removeByUrl = async (urlPath) => {
  if (!urlPath) return;

  const normalized = urlPath.replace(/^\/+/, '');
  const absolutePath = path.resolve(process.cwd(), normalized);
  try {
    await fs.unlink(absolutePath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
};

module.exports = { saveImage, removeByUrl };
