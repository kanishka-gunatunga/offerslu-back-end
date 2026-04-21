'use strict';

const { Op } = require('sequelize');
const { Category } = require('../models');
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

  const { rows, count } = await Category.findAndCountAll({
    where,
    order: [['name', 'ASC']],
    limit,
    offset,
  });
  return { items: rows, meta: buildPageMeta({ total: count, page, limit }) };
};

const getById = async (id) => {
  const category = await Category.findByPk(id);
  if (!category) throw ApiError.notFound('Category not found');
  return category;
};

const create = async (payload) => {
  const slug = slugify(payload.name);
  return Category.create({ ...payload, slug });
};

const update = async (id, payload) => {
  const category = await getById(id);
  const patch = { ...payload };
  if (payload.name) patch.slug = slugify(payload.name);
  await category.update(patch);
  return category;
};

const remove = async (id) => {
  const category = await getById(id);
  await category.destroy();
};

module.exports = { list, getById, create, update, remove };
