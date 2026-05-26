'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { put, del } = require('@vercel/blob');

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
  const filename = `${crypto.randomUUID()}${fileExt(file.mimetype)}`;

  // If Vercel Blob token is configured, use it
  if (env.blobToken) {
    const pathname = `${entity}/${entityId}/${filename}`;
    const blob = await put(pathname, file.buffer, {
      access: 'public',
      token: env.blobToken,
      contentType: file.mimetype,
    });
    return {
      absolutePath: blob.url,
      relativeUrl: blob.url,
    };
  }

  // Fallback to local storage (for local development/testing without token)
  const dir = path.join(uploadWriteRoot, entity, entityId);
  await ensureDir(dir);

  const absolutePath = path.join(dir, filename);
  await fs.writeFile(absolutePath, file.buffer);

  const publicPath = `/uploads/${entity}/${entityId}/${filename}`;
  return { absolutePath, relativeUrl: publicPath };
};

const removeByUrl = async (urlPath) => {
  if (!urlPath) return;

  // Check if it's a Vercel Blob URL (starts with http/https and contains vercel-storage)
  if (/^https?:\/\//i.test(urlPath) && urlPath.includes('vercel-storage.com')) {
    if (!env.blobToken) {
      console.warn('Vercel Blob token not configured; skipping deletion for URL:', urlPath);
      return;
    }
    try {
      await del(urlPath, {
        token: env.blobToken,
      });
    } catch (err) {
      console.error('Failed to delete image from Vercel Blob:', err);
    }
    return;
  }

  // Otherwise treat as local path
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
