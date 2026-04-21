'use strict';

const express = require('express');
const controller = require('../controllers/offer.controller');
const { validate } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');
const schemas = require('../validators/offer.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', validate(schemas.list), controller.list);
router.get('/:id', validate(schemas.byId), controller.getById);
router.post('/', upload.single('attachment'), validate(schemas.create), controller.create);
router.patch('/:id', upload.single('attachment'), validate(schemas.update), controller.update);
router.delete('/:id', validate(schemas.byId), controller.remove);

module.exports = router;
