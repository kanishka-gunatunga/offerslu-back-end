'use strict';

const express = require('express');
const controller = require('../controllers/offer.controller');
const { validate } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { verifyAdminOrigin } = require('../middlewares/csrf.middleware');
const { upload } = require('../middlewares/upload.middleware');
const schemas = require('../validators/offer.validator');

const router = express.Router();

router.use(authenticate);
router.use(verifyAdminOrigin);

router.get('/', validate(schemas.list), controller.list);
router.get('/:id', validate(schemas.byId), controller.getById);
const offerMultipart = upload.fields([
  { name: 'heroImageFile', maxCount: 1 },
  { name: 'bannerImageFile', maxCount: 1 },
  { name: 'companyLogoFile', maxCount: 1 },
]);

router.post('/', offerMultipart, validate(schemas.create), controller.create);
router.patch('/:id', offerMultipart, validate(schemas.update), controller.update);
router.post('/:id', offerMultipart, validate(schemas.update), controller.update);
router.delete('/:id', validate(schemas.byId), controller.remove);

module.exports = router;
