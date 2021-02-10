const express = require('express');
const validate = require('express-validation');
const expressJwt = require('express-jwt');
const paramValidation = require('../../config/param-validation');
const authCtrl = require('./auth.controller');
const userCtrl = require('../user/user.controller');
const config = require('../../config/config');
const firebaseValidate = require('../helpers/firebaseValidate');

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(firebaseValidate(), authCtrl.)

/** POST /api/auth/login - Returns token if correct username and password is provided */
router.route('/login')
  .post(validate(paramValidation.login), authCtrl.login);

router.route('/verify/:token')
  .get(validate(paramValidation.verify), authCtrl.verify);

/** GET /api/auth/random-number - Protected route,
 * needs token returned by the above as header. Authorization: Bearer {token} */
router.route('/random-number')
  .get(expressJwt({ secret: config.jwtSecret, algorithms: ['HS256'] }), authCtrl.getRandomNumber);

/** Load user when API with token route parameter is hit */
router.param('token', userCtrl.loadByVerificationToken);

module.exports = router;
