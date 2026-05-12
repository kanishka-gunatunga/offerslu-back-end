'use strict';

/**
 * Multipart clients often send repeated IDs as `merchantIds[]`, `offerTypeIds[]`, etc.
 * Joi `stripUnknown` drops keys not listed in the schema, so those values were removed
 * before the offer service ran — relations looked empty and saves failed in confusing ways.
 */
const ID_ARRAY_KEYS = [
  'offerTypeIds',
  'categoryIds',
  'merchantIds',
  'paymentIds',
  'bankIds',
  'locationIds',
];

const mergeIdValues = (a, b) => {
  const toArr = (v) => {
    if (v === undefined || v === null) return [];
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
    return String(v)
      .trim()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };
  return [...new Set([...toArr(a), ...toArr(b)])];
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 */
const normalizeOfferFormBody = (req, _res, next) => {
  if (!req.body || typeof req.body !== 'object') return next();

  for (const key of ID_ARRAY_KEYS) {
    const bracketKey = `${key}[]`;
    if (!Object.prototype.hasOwnProperty.call(req.body, bracketKey)) continue;

    const bracketVal = req.body[bracketKey];
    const directVal = req.body[key];

    if (directVal === undefined) {
      req.body[key] = bracketVal;
    } else {
      req.body[key] = mergeIdValues(bracketVal, directVal);
    }
    delete req.body[bracketKey];
  }

  return next();
};

module.exports = { normalizeOfferFormBody };
