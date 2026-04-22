'use strict';

const env = require('../config/env');
const logger = require('../config/logger');
const { sequelize, User, SiteContent } = require('../models');

const ensureIndex = async (queryInterface, tableName, fields, options = {}) => {
  const name = options.name || `${tableName}_${fields.join('_')}_idx`;
  try {
    await queryInterface.addIndex(tableName, fields, { ...options, name });
  } catch (err) {
    if (!/Duplicate key name|already exists/i.test(err.message)) {
      throw err;
    }
  }
};

const run = async () => {
  try {
    const shouldForce = process.argv.includes('--force');
    if (!shouldForce) {
      logger.error('Run with --force to recreate schema: npm run db:setup -- --force');
      process.exit(1);
    }

    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    const qi = sequelize.getQueryInterface();
    await ensureIndex(qi, 'offers', ['start_date']);
    await ensureIndex(qi, 'offers', ['end_date']);
    await ensureIndex(qi, 'offers', ['is_inactive']);
    await ensureIndex(qi, 'offers', ['title', 'company_name', 'description'], {
      type: 'FULLTEXT',
      name: 'offers_text_search_idx',
    });

    const admin = await User.findOne({ where: { email: env.admin.email } });
    if (!admin) {
      await User.create({
        email: env.admin.email,
        passwordHash: env.admin.password,
        isActive: true,
      });
      logger.info('Created default admin account.');
    }

    const siteContent = await SiteContent.findOne({ where: { isDefault: true } });
    if (!siteContent) {
      await SiteContent.create({
        siteName: 'Offerlu',
        hero: {},
        categories: [],
        promotionSections: [],
        promotions: [],
        banks: [],
        about: {},
        socialLinks: [],
        isDefault: true,
      });
      logger.info('Created default site content.');
    }

    logger.info('Database setup completed.');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    logger.error(`Database setup failed: ${err.stack || err.message}`);
    process.exit(1);
  }
};

run();
