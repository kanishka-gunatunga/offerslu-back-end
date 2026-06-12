'use strict';

const { Op } = require('sequelize');

const todayDateOnly = () => new Date().toISOString().slice(0, 10);

const addDaysToDateOnly = (dateOnly, days) => {
  const date = new Date(`${dateOnly}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** Matches admin list filter status=active (offer.service buildStatusWhere). */
const buildActiveOfferWhere = (today = todayDateOnly()) => ({
  isInactive: false,
  startDate: { [Op.lte]: today },
  endDate: { [Op.gte]: today },
});

/** Active offers whose end date falls within the next `days` days (inclusive). */
const buildExpiringSoonOfferWhere = (days = 7, today = todayDateOnly()) => {
  const safeDays = Math.min(Math.max(Number(days) || 7, 1), 90);
  return {
    isInactive: false,
    startDate: { [Op.lte]: today },
    endDate: { [Op.gte]: today, [Op.lte]: addDaysToDateOnly(today, safeDays) },
  };
};

const activeOfferSqlConditions = () =>
  `o.is_inactive = false
          AND o.end_date >= :today
          AND o.start_date <= :today`;

module.exports = {
  todayDateOnly,
  addDaysToDateOnly,
  buildActiveOfferWhere,
  buildExpiringSoonOfferWhere,
  activeOfferSqlConditions,
};
