const Product = require('./product.model');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const multer = require('multer');
const upload = multer({dest: __dirname + '/uploads/images'});

/**
 * Get product
 * @returns {Product}
 */
function get(req, res) {
  return res.json(publicize(new Array(req.product)));
}

/**
 * Upload new image
 * @property {string} req.body.tag - Tag ID used in store.
 * @returns {Product}
 */
function create(req, res, next) {
  const user = req.user;
  if (!user.isAdmin) return next(new APIError('Must be Administrator', httpStatus.UNAUTHORIZED));

  return product.save()
    .then(savedProduct => res.json(savedProduct))
    .catch(e => next(e));
}

/**
 * Update existing product
 * @property {string} req.body.tag - The tag of product.
 * @property {string} req.body.name - The name of product.
 * @returns {Product}
 */
function update(req, res, next) {
  const user = req.user;
  if (!user.isAdmin) return next(new APIError('Must be Administrator', httpStatus.UNAUTHORIZED));
  const product = req.product;
  product.tag = req.body.tag;
  product.name = req.body.name;
  product.description = req.body.description;
  product.category = req.body.category;
  product.price = req.body.price;
  product.images = req.body.images;
  product.sizes = req.body.sizes;
  product.taxExempt = req.body.taxExempt;
  product.comments = req.body.comments;

  return product.save()
    .then(savedProduct => res.json(savedProduct))
    .catch(e => next(e));
}

/**
 * Get product list.
 * @property {number} req.query.skip - Number of products to be skipped.
 * @property {number} req.query.limit - Limit number of products to be returned.
 * @property {string} req.query.q - Fuzzy Search String
 * @returns {Product[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0, root = null } = req.query;
  if (req.query.q != undefined) Product.find((root) ? {root} : {}).fuzzySearch(req.query.q).limit(+limit).skip(+skip).exec()
    .then(products => res.json({ "products": publicize(new Array(products))}))
    .catch(e => next(e));
  else Product.list({ limit, skip, root })
    .then(products => res.json({ "products": publicize(new Array(products))}))
    .catch(e => next(e));
}

/**
 * Delete product.
 * @returns {Product}
 */
function remove(req, res, next) {
  const user = req.user;
  if (!user.isAdmin) return next(new APIError('Must be Administrator', httpStatus.UNAUTHORIZED));
  const product = req.product;
  return product.remove()
    .then(deletedProduct => res.json(deletedProduct))
    .catch(e => next(e));
}

module.exports = { load, loadByTag, getSubTotal, getTaxInfo, get, create, update, list, remove };
