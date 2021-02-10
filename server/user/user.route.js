const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const userCtrl = require('./user.controller');
const firebaseValidate = require('../helpers/firebaseValidate');

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  /** GET /api/users - Get list of users */
  .get(firebaseValidate, userCtrl.list)

  /** POST /api/users - Create new user */
  .post(firebaseValidate, validate(paramValidation.createUser), userCtrl.create);

router.route('/:userId')
  /** GET /api/users/:userId - Get user */
  .get(firebaseValidate, userCtrl.get)

  /** PUT /api/users/:userId - Update user */
  .put(firebaseValidate, validate(paramValidation.updateUser), userCtrl.update)

  /** DELETE /api/users/:userId - Delete user */
  .delete(firebaseValidate, userCtrl.remove);

/** Load user when API with userId route parameter is hit */
router.param('userId', userCtrl.load);

module.exports = router;
