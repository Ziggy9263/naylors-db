const express = require('express');
const expressJwt = require('express-jwt');
const config = require('../../config/config');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const productCtrl = require('./product.controller');

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  /** GET /api/products - Get list of products */
  .get(validate(paramValidation.getProduct),
    productCtrl.list)

  /** POST /api/products - Create new product */
  .post(expressJwt({ secret: config.jwtSecret }),
    validate(paramValidation.createProduct),
    productCtrl.create);

router.route('/:tag')
  /** GET /api/products/:tag - Get product */
  .get(productCtrl.get)

  /** PUT /api/products/:tag - Update product */
  .put(expressJwt({ secret: config.jwtSecret }),
    validate(paramValidation.updateProduct),
    productCtrl.update)

  /** DELETE /api/products/:tag - Delete product */
  .delete(expressJwt({ secret: config.jwtSecret }),
    productCtrl.remove);

/** Load product when API with tag route parameter is hit */
router.param('tag', productCtrl.load);

module.exports = router;
