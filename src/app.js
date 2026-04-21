'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(
  morgan(env.isProd ? 'combined' : 'dev', {
    stream: logger.stream,
  })
);

const globalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

app.use(
  '/uploads',
  express.static(path.resolve(process.cwd(), env.upload.dir), {
    fallthrough: false,
    maxAge: '7d',
  })
);

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
