const Category = require('./category.model');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');


/**
 * Remove sensitive data from an array of categories.
 * @param {Object<Category>[]} categoryArray - Should be an array of mongoose objects
 * @returns {Object<Category>[]}
 */
function publicize(categoryArray) {
  const publicArray = categoryArray;
  categoryArray.forEach((category, index) => {
    if ('comments' in category) delete publicArray[index].comments;
  });
  return (publicArray.length === 1) ? publicArray[0] : publicArray;
}

/**
 * Load category and append to req.
 */
function load(req, res, next, id) {
  Category.get(id)
    .then((category) => {
      req.category = category; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Load Category Via Code
 * @param {Number} code - Code assigned upon category DB entry
 * @returns {Promise<Object|APIError>}
 */
function loadByCode(code) {
  return Category.get(code)
  .then(category => Promise.resolve(category))
  .catch(e => Promise.reject(new APIError(e, httpStatus.INTERNAL_SERVER_ERROR)));
}

/**
 * Get category
 * @returns {Category}
 */
function get(req, res) {
  return res.json(publicize(new Array(req.category)));
}

/**
 * Create new category
 * @property {string} req.body.code - Code ID used in store.
 * @property {string} req.body.name - User-friendly name of category.
 * @property {string} req.body.department - Name of department.
 * @property {string} req.body.comments - Administrator comments for dashboard use only.
 * @returns {Category}
 */
function create(req, res, next) {
  const user = req.user;
  if (!user.isAdmin) return next(new APIError('Must be Administrator', httpStatus.UNAUTHORIZED));
  const category = new Category({
    code: req.body.code,
    name: req.body.name,
    department: req.body.department,
    comments: req.body.comments
  });

  return category.save()
    .then(savedCategory => res.json(savedCategory))
    .catch(e => next(e));
}

/**
 * Update existing category
 * @property {number} req.body.code - The code of category.
 * @property {string} req.body.name - The name of category.
 * @property {number} req.body.department - Department
 * @returns {Category}
 */
function update(req, res, next) {
  const user = req.user;
  if (!user.isAdmin) return next(new APIError('Must be Administrator', httpStatus.UNAUTHORIZED));
  const category = req.category;
  category.code = req.body.code;
  category.name = req.body.name;
  category.department = req.body.department;
  category.comments = req.body.comments;

  return category.save()
    .then(savedCategory => res.json(savedCategory))
    .catch(e => next(e));
}

/**
 * Get category list.
 * @property {number} req.query.skip - Number of categories to be skipped.
 * @property {number} req.query.limit - Limit number of categories to be returned.
 * @property {string} req.query.q - Fuzzy Search String
 * @returns {Category[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  if (req.query.q != undefined) Category.find({}).fuzzySearch(req.query.q).limit(+limit).skip(+skip).exec()
    .then(categories => res.json({ "categories": publicize(new Array(categories))}))
    .catch(e => next(e));
  else Category.list({ limit, skip })
    .then(categories => res.json({ "categories": publicize(new Array(categories))}))
    .catch(e => next(e));
}

/**
 * Delete category.
 * @returns {Category}
 */
function remove(req, res, next) {
  const user = req.user;
  if (!user.isAdmin) return next(new APIError('Must be Administrator', httpStatus.UNAUTHORIZED));
  const category = req.category;
  return category.remove()
    .then(deletedCategory => res.json(deletedCategory))
    .catch(e => next(e));
}

module.exports = { load, loadByCode, get, create, update, list, remove };
