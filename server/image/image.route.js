const express = require('express');
const expressJwt = require('express-jwt');
const config = require('../../config/config');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const productCtrl = require('../product/product.controller');
const imageCtrl = require('./image.controller');

const router = express.Router(); // eslint-disable-line new-cap

/*router.route('/')
  /** GET /api/products - Get list of products *
  .get(validate(paramValidation.getProduct),
    productCtrl.list) */

router.route('/:tag')
  /** GET /api/products/:tag - Get product */
  .get(imageCtrl.get)

  /** POST /api/products - Create new product */
  .post(expressJwt({ secret: config.jwtSecret, algorithms: ['HS256'] }),
    validate(paramValidation.imageUpload),
    imageCtrl.create);

  /** DELETE /api/products/:tag - Delete product */
  .delete(expressJwt({ secret: config.jwtSecret, algorithms: ['HS256'] }),
    imageCtrl.remove);

/** Load product when API with tag route parameter is hit */
router.param('tag', productCtrl.load);

module.exports = router;
