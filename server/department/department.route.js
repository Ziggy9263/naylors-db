const express = require('express');
const expressJwt = require('express-jwt');
const config = require('../../config/config');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const departmentCtrl = require('./department.controller');

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  /** GET /api/departments - Get list of departments */
  .get(validate(paramValidation.getDepartment),
    departmentCtrl.list)

  /** POST /api/departments - Create new department */
  .post(firebaseValidate,
    appendUser,
    validate(paramValidation.createDepartment),
    departmentCtrl.create);

router.route('/:code')
  /** GET /api/departments/:code - Get department */
  .get(departmentCtrl.get)

  /** PUT /api/departments/:code - Update department */
  .put(firebaseValidate,
    appendUser,
    validate(paramValidation.updateDepartment),
    departmentCtrl.update)

  /** DELETE /api/departments/:code - Delete department */
  .delete(firebaseValidate,
    appendUser,
    departmentCtrl.remove);

/** Load department when API with code route parameter is hit */
router.param('code', departmentCtrl.load);

module.exports = router;
