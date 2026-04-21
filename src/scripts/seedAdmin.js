'use strict';

/**
 * Seeds the single admin user from ADMIN_USERNAME / ADMIN_PASSWORD env vars.
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

    const existing = await User.findOne({ where: { username: env.admin.username } });

    if (existing) {
      if (resetPassword) {
        existing.password = env.admin.password;
        existing.isActive = true;
        await existing.save();
        logger.info(`Admin user "${env.admin.username}" password reset.`);
      } else {
        logger.info(`Admin user "${env.admin.username}" already exists. Skipping.`);
      }
    } else {
      await User.create({
        username: env.admin.username,
        password: env.admin.password,
        role: 'admin',
        isActive: true,
      });
      logger.info(`Admin user "${env.admin.username}" created.`);
    }

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    logger.error(`Seed failed: ${err.stack || err.message}`);
    process.exit(1);
  }
};

run();
