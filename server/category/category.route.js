const express = require('express');
const firebaseValidate = require('../helpers/firebaseValidate');
const appendUser = require('../helpers/appendUser');
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
  .post(firebaseValidate,
    appendUser,
    validate(paramValidation.createCategory),
    categoryCtrl.create);

router.route('/:id')
  /** GET /api/categories/:id - Get category */
  .get(categoryCtrl.get)

  /** PUT /api/categories/:id - Update category */
  .put(firebaseValidate,
    appendUser,
    validate(paramValidation.updateCategory),
    categoryCtrl.update)

  /** DELETE /api/categories/:id - Delete category */
  .delete(firebaseValidate,
    appendUser,
    categoryCtrl.remove);

/** Load category when API with id route parameter is hit */
router.param('id', categoryCtrl.load);

module.exports = router;
