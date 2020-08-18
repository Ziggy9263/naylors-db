const User = require('./user.model');
const uuid = require('uuid');
const config = require('../../config/config');
// const mail = require('../helpers/mail');
// const { config } = require('bluebird');

/**
 * Remove sensitive data from user object.
 * @param {Object<User>} userInfo - Should be a mongoose object
 * @returns {Object<User>}
 */
function publicize(userInfo) {
  const publicUser = userInfo.toObject();
  if ('password' in userInfo) delete publicUser.password;
  if ('verification' in userInfo) {
    publicUser.verification = (userInfo.verification === 'verified') ? 'verified' : 'unverified';
  }
  if ('isAdmin' in userInfo === false) delete publicUser.isAdmin;
  return publicUser;
}

/**
 * Load user and append to req.
 */
function load(req, res, next, id) {
  User.get(id)
    .then((user) => {
      req.user = user; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Load User Via Verification Token
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @param {string} token - Verification token created by UUID upon user creation
 */
function loadByVerificationToken(req, res, next, token) {
  User.findOne({ verification: token })
  .then((user) => {
    // eslint-disable-next-line no-param-reassign
    req.user = user;
    return next();
  })
  .catch(e => next(e));
}

/**
 * Get user
 * @returns {User}
 */
function get(req, res) {
  return res.json(req.user);
}

/**
 * Create new user
 * @property {string} req.body.email - The email of user.
 * @property {string} req.body.phone - The phone of user.
 * @property {string} req.body.password
 * @property {string} req.body.business
 * @property {string} req.body.address
 * @property {string} req.body.taxExempt
 * @property {boolean} req.body.isAdmin
 * @property {string} req.body.adminVerification - Must match server secret key
 * @property {string} req.body.comments
 * @returns {User}
 */
function create(req, res, next) {
  const userData = {
    email: req.body.email,
    password: req.body.password,
    name: req.body.name,
    phone: req.body.phone,
    business: req.body.businessInfo,
    address: req.body.addressInfo,
    taxExempt: req.body.taxExempt,
    comments: req.body.comments,
    verification: uuid.v4()
  };
  if (req.body.isAdmin) {
    userData.isAdmin = (req.body.adminVerification === config.adminCode);
  }

  const user = new User(userData);
  user.save()
    .then((savedUser) => {
      // mail.sendVerification(savedUser); UNCOMMENT WHEN DESIRED
      res.json(publicize(savedUser));
    })
    .catch(e => next(e));
}

/**
 * Update existing user
 * @property {string} req.body.email - The email of user.
 * @property {string} req.body.phone - The phone of user.
 * @property {string} req.body.password
 * @property {string} req.body.business
 * @property {string} req.body.address
 * @property {string} req.body.taxExempt
 * @property {boolean} req.body.isAdmin
 * @property {string} req.body.adminVerification - Must match server secret key
 * @property {string} req.body.comments
 * @returns {User}
 */
function update(req, res, next) {
  const user = req.user;
  const keys = Object.keys(req.body);
  keys.forEach((key) => {
    user[key] = req.body[key];
  });

  if (req.body.isAdmin) {
    user.isAdmin = (req.body.adminVerification === config.adminCode);
  }

  user.save()
    .then(savedUser => res.json(publicize(savedUser)))
    .catch(e => next(e));
}

/**
 * Get user list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {User[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  User.list({ limit, skip })
    .then(users => res.json(users))
    .catch(e => next(e));
}

/**
 * Delete user.
 * @returns {User}
 */
function remove(req, res, next) {
  const user = req.user;
  user.remove()
    .then(deletedUser => res.json(deletedUser))
    .catch(e => next(e));
}

module.exports = { load, loadByVerificationToken, get, create, update, list, remove };
