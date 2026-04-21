'use strict';

const { Op } = require('sequelize');
const { Merchant } = require('../models');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildPageMeta } = require('../utils/pagination');

const slugify = (value) =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const list = async (query) => {
  const { page, limit, offset } = parsePagination(query, { defaultLimit: 50 });
  const where = {};
  if (query.search) where.name = { [Op.like]: `%${query.search}%` };
  if (query.isActive !== undefined) where.isActive = query.isActive;

  const { rows, count } = await Merchant.findAndCountAll({
    where,
    order: [['name', 'ASC']],
    limit,
    offset,
  });
  return { items: rows, meta: buildPageMeta({ total: count, page, limit }) };
};

const getById = async (id) => {
  const merchant = await Merchant.findByPk(id);
  if (!merchant) throw ApiError.notFound('Merchant not found');
  return merchant;
};

const create = async (payload) => {
  const slug = slugify(payload.name);
  return Merchant.create({ ...payload, slug });
};

const update = async (id, payload) => {
  const merchant = await getById(id);
  const patch = { ...payload };
  if (payload.name) patch.slug = slugify(payload.name);
  await merchant.update(patch);
  return merchant;
};

const remove = async (id) => {
  const merchant = await getById(id);
  await merchant.destroy();
};

module.exports = { list, getById, create, update, remove };
