const express = require('express');
const expressJwt = require('express-jwt');
const config = require('../../config/config');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const categoryCtrl = require('./category.controller');

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  /** GET /api/categories - Get list of categories */
  .get(validate(paramValidation.getProduct),
    categoryCtrl.list)

  /** POST /api/categories - Create new category */
  .post(expressJwt({ secret: config.jwtSecret, algorithms: ['HS256'] }),
    validate(paramValidation.createProduct),
    categoryCtrl.create);

router.route('/:code')
  /** GET /api/categories/:code - Get category */
  .get(categoryCtrl.get)

  /** PUT /api/categories/:code - Update category */
  .put(expressJwt({ secret: config.jwtSecret, algorithms: ['HS256'] }),
    validate(paramValidation.updateProduct),
    categoryCtrl.update)

  /** DELETE /api/categories/:code - Delete category */
  .delete(expressJwt({ secret: config.jwtSecret, algorithms: ['HS256'] }),
    categoryCtrl.remove);

/** Load category when API with code route parameter is hit */
router.param('code', categoryCtrl.load);

module.exports = router;
