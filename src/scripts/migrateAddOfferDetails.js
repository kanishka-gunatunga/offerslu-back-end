'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../models');
const logger = require('../config/logger');

const run = async () => {
  try {
    await sequelize.authenticate();
    const qi = sequelize.getQueryInterface();
    const table = await qi.describeTable('offers');

    if (table.offer_details) {
      logger.info('Migration skipped: offers.offer_details already exists.');
      await sequelize.close();
      process.exit(0);
    }

    await qi.addColumn('offers', 'offer_details', {
      type: DataTypes.TEXT,
      allowNull: true,
    });

    logger.info('Migration complete: added offers.offer_details.');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    logger.error(`Migration failed: ${err.stack || err.message}`);
    process.exit(1);
  }
};

run();
