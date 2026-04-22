'use strict';

/**
 * Seeds the single admin user from ADMIN_EMAIL / ADMIN_PASSWORD env vars.
 * Idempotent: if admin already exists, it will not be replaced.
 * Pass --reset-password to forcefully reset the admin password to ADMIN_PASSWORD.
 */

const env = require('../config/env');
const logger = require('../config/logger');
const { sequelize, User } = require('../models');

const run = async () => {
  const args = process.argv.slice(2);
  const resetPassword = args.includes('--reset-password');

  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const existing = await User.findOne({ where: { email: env.admin.email } });

    if (existing) {
      if (resetPassword) {
        existing.passwordHash = env.admin.password;
        existing.isActive = true;
        await existing.save();
        logger.info(`Admin user "${env.admin.email}" password reset.`);
      } else {
        logger.info(`Admin user "${env.admin.email}" already exists. Skipping.`);
      }
    } else {
      await User.create({
        email: env.admin.email,
        passwordHash: env.admin.password,
        isActive: true,
      });
      logger.info(`Admin user "${env.admin.email}" created.`);
    }

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    logger.error(`Seed failed: ${err.stack || err.message}`);
    process.exit(1);
  }
};

run();
