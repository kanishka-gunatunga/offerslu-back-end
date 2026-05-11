'use strict';

/**
 * Local: `node src/server.js` → connects DB and listens on PORT.
 * Vercel: this file is the serverless entry; it must export an Express app.
 * @see https://vercel.com/docs/frameworks/backend/express
 */

require('./models');

const express = require('express');
const baseApp = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { sequelize, connectDatabase } = require('./config/database');

let dbPromise = null;
const ensureDatabase = () => {
  if (!dbPromise) {
    dbPromise = connectDatabase();
  }
  return dbPromise;
};

const app = express();
app.use(async (req, res, next) => {
  try {
    await ensureDatabase();
    next();
  } catch (err) {
    next(err);
  }
});
app.use(baseApp);

let server;

const startServer = async () => {
  try {
    await ensureDatabase();

    server = app.listen(env.port, () => {
      logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
      logger.info(`API base: http://localhost:${env.port}${env.apiPrefix}`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      try {
        await sequelize.close();
        logger.info('Connections closed. Exiting.');
        process.exit(0);
      } catch (err) {
        logger.error(`Error during shutdown: ${err.message}`);
        process.exit(1);
      }
    });
    setTimeout(() => {
      logger.error('Force exit after timeout.');
      process.exit(1);
    }, 10_000).unref();
  } else {
    process.exit(0);
  }
};

if (require.main === module) {
  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Rejection: ${reason instanceof Error ? reason.stack : reason}`);
  });

  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.stack || err.message}`);
    shutdown('uncaughtException');
  });

  ['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));

  startServer();
}

module.exports = app;
