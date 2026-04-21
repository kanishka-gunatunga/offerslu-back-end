'use strict';

const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { sequelize, connectDatabase } = require('./config/database');
require('./models');

let server;

const startServer = async () => {
  try {
    await connectDatabase();

    if (!env.isProd) {
      // In development, sync schema (non-destructive).
      await sequelize.sync({ alter: false });
      logger.info('Database models synchronized.');
    }

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

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason instanceof Error ? reason.stack : reason}`);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.stack || err.message}`);
  shutdown('uncaughtException');
});

['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));

startServer();
