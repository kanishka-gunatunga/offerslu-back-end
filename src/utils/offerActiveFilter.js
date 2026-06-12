'use strict';

const { Op } = require('sequelize');

const todayDateOnly = () => new Date().toISOString().slice(0, 10);

/** Matches admin list filter status=active (offer.service buildStatusWhere). */
const buildActiveOfferWhere = (today = todayDateOnly()) => ({
  isInactive: false,
  startDate: { [Op.lte]: today },
  endDate: { [Op.gte]: today },
});

const activeOfferSqlConditions = () =>
  `o.is_inactive = false
          AND o.end_date >= :today
          AND o.start_date <= :today`;

module.exports = {
  todayDateOnly,
  buildActiveOfferWhere,
  activeOfferSqlConditions,
};
