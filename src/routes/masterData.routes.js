'use strict';

const express = require('express');
const controller = require('../controllers/masterData.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { verifyAdminOrigin } = require('../middlewares/csrf.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { upload } = require('../middlewares/upload.middleware');
const schemas = require('../validators/masterData.validator');

const router = express.Router();

router.use(authenticate);
router.use(verifyAdminOrigin);

const masterUpload = upload.fields([
  { name: 'bannerImageFile', maxCount: 1 },
  { name: 'logoImageFile', maxCount: 1 },
]);

router.get('/:entity', validate(schemas.list), controller.list);
router.post('/:entity', masterUpload, validate(schemas.create), controller.create);
router.patch('/:entity/:id', masterUpload, validate(schemas.update), controller.update);
router.delete('/:entity/:id', validate(schemas.byId), controller.remove);

module.exports = router;
