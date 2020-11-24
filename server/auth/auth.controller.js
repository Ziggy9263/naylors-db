const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const config = require('../../config/config');
const User = require('../user/user.model');

/**
 * Returns jwt token if valid email and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function login(req, res, next) {
  // Creates and returns JWT from User.email
  let email = null;
  let isAdmin;
  User.findOne({ email: req.body.email.toLowerCase() })
  // eslint-disable-next-line consistent-return
  .then((user) => {
    if (!user) return next(new APIError('User Not Found', httpStatus.BAD_REQUEST));
    user.comparePassword(req.body.password, (comparePassErr, isMatch) => {
      if (comparePassErr) return next(comparePassErr);
      if (!isMatch) return next(new APIError('Password Does Not Match', httpStatus.BAD_REQUEST));
      email = user.email;
      isAdmin = user.isAdmin;

      if (email) {
        return res.json({
	  token: jwt.sign({ email, isAdmin }, config.jwtSecret, { algorithm: 'HS256' }),
          email
        });
      }

      const err = new APIError('Authentication error', httpStatus.UNAUTHORIZED, true);
      return next(err);
    });
  })
  .catch(e => next(e));
}

function verify(req, res, next) {
  const user = req.user;
  if (!user) next(new APIError('Token Invalid', httpStatus.BAD_REQUEST));
  if (user.verification === req.params.token) {
    user.verification = 'verified';
    user.save();
    return res.json({ verificationSuccess: true });
  }
  return next(new APIError('Verification Error', httpStatus.INTERNAL_SERVER_ERROR));
}

/**
 * This is a protected route. Will return random number only if jwt token is provided in header.
 * @param req
 * @param res
 * @returns {*}
 */
function getRandomNumber(req, res) {
  // req.user is assigned by jwt middleware if valid token is provided
  return res.json({
    user: req.user,
    num: Math.random() * 100
  });
}

module.exports = { login, verify, getRandomNumber };
