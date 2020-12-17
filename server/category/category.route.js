const express = require('express');
const expressJwt = require('express-jwt');
const config = require('../../config/config');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const categoryCtrl = require('./category.controller');

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  /** GET /api/categories - Get list of categories */
  .get(validate(paramValidation.getCategory),
    categoryCtrl.list)

  /** POST /api/categories - Create new category */
  .post(expressJwt({ secret: config.jwtSecret, algorithms: ['HS256'] }),
    validate(paramValidation.createCategory),
    categoryCtrl.create);

router.route('/:id')
  /** GET /api/categories/:id - Get category */
  .get(categoryCtrl.get)

  /** PUT /api/categories/:id - Update category */
  .put(expressJwt({ secret: config.jwtSecret, algorithms: ['HS256'] }),
    validate(paramValidation.updateCategory),
    categoryCtrl.update)

  /** DELETE /api/categories/:id - Delete category */
  .delete(expressJwt({ secret: config.jwtSecret, algorithms: ['HS256'] }),
    categoryCtrl.remove);

/** Load category when API with id route parameter is hit */
router.param('id', categoryCtrl.load);

module.exports = router;
