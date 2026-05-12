'use strict';

const fs = require('fs');
const path = require('path');
const { URL } = require('node:url');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const compression = require('compression');
const env = require('./config/env');
const { createGlobalLimiter } = require('./middlewares/rateLimit.middleware');
const logger = require('./config/logger');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

const IMAGE_CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

const setUploadHeaders = (res, filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const imageType = IMAGE_CONTENT_TYPES[ext];

  if (imageType) {
    res.setHeader('Content-Type', imageType);
  }

  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
};

app.disable('x-powered-by');
app.set('trust proxy', process.env.VERCEL === '1' ? true : 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(
  morgan(env.isProd ? 'combined' : 'dev', {
    stream: logger.stream,
  })
);

const globalLimiter = createGlobalLimiter(env);
app.use(globalLimiter);

const uploadWriteRootResolved = env.upload.writeRoot;

const resolveSafeUploadPath = (root, safe) => {
  const resolvedRoot = path.resolve(root);
  const resolvedFile = path.resolve(path.join(resolvedRoot, safe));
  const rel = path.relative(resolvedRoot, resolvedFile);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return null;
  }
  return resolvedFile;
};

/** Vercel does not serve express.static from the function bundle; stream files explicitly. */
const serveUploadFromDisk = (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  let pathname;
  try {
    pathname = new URL(req.originalUrl, `http://${req.headers.host || 'localhost'}`).pathname;
  } catch {
    return next();
  }

  if (!pathname.startsWith('/uploads/')) {
    return next();
  }

  const subPath = pathname.slice('/uploads/'.length);
  const safe = path.normalize(subPath).replace(/^(\.\.(\/|\\|$))+/, '');

  const tryFile = (root, then) => {
    const resolvedFile = resolveSafeUploadPath(root, safe);
    if (!resolvedFile) {
      return then();
    }
    fs.stat(resolvedFile, (err, st) => {
      if (!err && st.isFile()) {
        setUploadHeaders(res, resolvedFile);
        return res.sendFile(resolvedFile, (sendErr) => {
          if (sendErr) next(sendErr);
        });
      }
      then();
    });
  };

  tryFile(env.upload.bundleRoot, () => {
    tryFile(env.upload.writeRoot, () => next());
  });
};

if (process.env.VERCEL === '1') {
  app.use('/uploads', serveUploadFromDisk);
} else {
  app.use(
    '/uploads',
    express.static(uploadWriteRootResolved, {
      fallthrough: false,
      maxAge: '1y',
      immutable: true,
      etag: true,
      lastModified: true,
      setHeaders: setUploadHeaders,
    })
  );
}

app.use(env.apiPrefix, routes);

app.get('/', (_req, res) =>
  res.json({
    success: true,
    message: 'OffersLu Admin API',
    version: '1.0.0',
    docs: `${env.apiPrefix}/health`,
  })
);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
