'use strict';

/**
 * Seeds the single admin user from CLI flags.
 * Idempotent: if admin already exists, it will not be replaced.
 * Usage:
 *   npm run db:seed -- --email=admin@example.com --password=<strong-password>
 *   npm run db:seed -- --email=admin@example.com --password=<strong-password> --reset-password
 */

const logger = require('../config/logger');
const { sequelize, User } = require('../models');

const parseArg = (args, key) => {
  const prefixed = `${key}=`;
  const valueArg = args.find((arg) => arg.startsWith(prefixed));
  if (valueArg) {
    return valueArg.slice(prefixed.length).trim();
  }

  const index = args.indexOf(key);
  if (index >= 0 && args[index + 1]) {
    return args[index + 1].trim();
  }

  return '';
};

const run = async () => {
  const args = process.argv.slice(2);
  const resetPassword = args.includes('--reset-password');
  const email = parseArg(args, '--email').toLowerCase();
  const password = parseArg(args, '--password');

  if (!email || !password) {
    logger.error('Missing required args. Use --email and --password.');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const existing = await User.findOne({ where: { email } });

    if (existing) {
      if (resetPassword) {
        existing.passwordHash = password;
        existing.isActive = true;
        await existing.save();
        logger.info(`Admin user "${email}" password reset.`);
      } else {
        logger.info(`Admin user "${email}" already exists. Skipping.`);
      }
    } else {
      await User.create({
        email,
        passwordHash: password,
        isActive: true,
      });
      logger.info(`Admin user "${email}" created.`);
    }

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    logger.error(`Seed failed: ${err.stack || err.message}`);
    process.exit(1);
  }
};

run();
