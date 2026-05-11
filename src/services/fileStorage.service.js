'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const env = require('../config/env');

const uploadWriteRoot = env.upload.writeRoot;

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
  const dir = path.join(uploadWriteRoot, entity, entityId);
  await ensureDir(dir);

  const filename = `${crypto.randomUUID()}${fileExt(file.mimetype)}`;
  const absolutePath = path.join(dir, filename);
  await fs.writeFile(absolutePath, file.buffer);

  const publicPath = `/uploads/${entity}/${entityId}/${filename}`;
  return { absolutePath, relativeUrl: publicPath };
};

const removeByUrl = async (urlPath) => {
  if (!urlPath) return;

  let relative = String(urlPath).replace(/^\/+/, '');
  if (relative.startsWith('uploads/')) {
    relative = relative.slice('uploads/'.length);
  }
  const safe = path.normalize(relative).replace(/^(\.\.(\/|\\|$))+/, '');
  const absolutePath = path.join(uploadWriteRoot, safe);
  const resolvedRoot = path.resolve(uploadWriteRoot);
  const resolvedFile = path.resolve(absolutePath);
  const rel = path.relative(resolvedRoot, resolvedFile);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return;
  }

  try {
    await fs.unlink(resolvedFile);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
};

module.exports = { saveImage, removeByUrl };
