const Department = require('./department.model');
const catCont = require('../category/category.controller');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');


/**
 * Remove sensitive data from an array of departments.
 * @param {Object<Department>[]} departmentArray - Should be an array of mongoose objects
 * @returns {Object<Department>[]}
 */
function publicize(departmentArray) {
  const publicArray = departmentArray;
  departmentArray.forEach((department, index) => {
    if ('comments' in department) delete publicArray[index].comments;
  });
  return (publicArray.length === 1) ? publicArray[0] : publicArray;
}

/**
 * Load department and append to req.
 */
function load(req, res, next, code) {
  Department.get(code)
    .then((department) => {
      req.department = department; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Load Department Via Code
 * @param {Number} code - Code assigned upon department DB entry
 * @returns {Promise<Object|APIError>}
 */
function loadByCode(code) {
  return Department.get(code)
  .then(department => Promise.resolve(department))
  .catch(e => Promise.reject(new APIError(e, httpStatus.INTERNAL_SERVER_ERROR)));
}

/**
 * Get department
 * @returns {Department}
 */
function get(req, res) {
  return res.json(publicize(new Array(req.department)));
}

/**
 * Create new department
 * @property {string} req.body.code - Code ID used in store.
 * @property {string} req.body.name - User-friendly name of department.
 * @property {string} req.body.comments - Administrator comments for dashboard use only.
 * @returns {Department}
 */
async function create(req, res, next) {
  const user = req.user;
  if (!user.isAdmin) return next(new APIError('Must be Administrator', httpStatus.UNAUTHORIZED));
  const department = new Department({
    code: req.body.code,
    name: req.body.name,
    categories: await catCont.createByDepartmentArray(req.body.categories),
    comments: req.body.comments
  });

  return await department.save()
    .then(savedDepartment => res.json(savedDepartment))
    .catch(e => next(e));
}

/**
 * Update existing department
 * @property {number} req.body.code - The code of department.
 * @property {string} req.body.name - The name of department.
 * @returns {Department}
 */
function update(req, res, next) {
  const user = req.user;
  if (!user.isAdmin) return next(new APIError('Must be Administrator', httpStatus.UNAUTHORIZED));
  const department = req.department;
  department.code = req.body.code;
  department.name = req.body.name;
  department.comments = req.body.comments;

  return department.save()
    .then(savedDepartment => res.json(savedDepartment))
    .catch(e => next(e));
}

/**
 * Get department list.
 * @property {number} req.query.skip - Number of departments to be skipped.
 * @property {number} req.query.limit - Limit number of departments to be returned.
 * @property {string} req.query.q - Fuzzy Search String
 * @returns {Department[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  if (req.query.q != undefined) Department.find({}).fuzzySearch(req.query.q).limit(+limit).skip(+skip).exec()
    .then(departments => res.json({ "departments": publicize(new Array(departments))}))
    .catch(e => next(e));
  else Department.list({ limit, skip })
    .then(departments => res.json({ "departments": publicize(new Array(departments))}))
    .catch(e => next(e));
}

/**
 * Delete department.
 * @returns {Department}
 */
function remove(req, res, next) {
  const user = req.user;
  if (!user.isAdmin) return next(new APIError('Must be Administrator', httpStatus.UNAUTHORIZED));
  const department = req.department;
  return department.remove()
    .then(deletedDepartment => res.json(deletedDepartment))
    .catch(e => next(e));
}

module.exports = { load, loadByCode, get, create, update, list, remove };
