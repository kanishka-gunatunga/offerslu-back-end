'use strict';

const express = require('express');
const controller = require('../controllers/category.controller');
const { validate } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const schemas = require('../validators/lookup.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', validate(schemas.listQuery), controller.list);
router.get('/:id', validate(schemas.byId), controller.getById);
router.post('/', validate(schemas.createCategory), controller.create);
router.patch('/:id', validate(schemas.updateCategory), controller.update);
router.delete('/:id', validate(schemas.byId), controller.remove);

module.exports = router;
