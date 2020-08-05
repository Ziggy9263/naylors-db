const Product = require('./product.model');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');


/**
 * Remove sensitive data from an array of products.
 * @param {Object<Product>[]} productArray - Should be an array of mongoose objects
 * @returns {Object<Product>[]}
 */
function publicize(productArray) {
  const publicArray = productArray;
  productArray.forEach((product, index) => {
    if ('comments' in product) delete publicArray[index].comments;
    if ('taxExempt' in product) delete publicArray[index].taxExempt;
  });
  return (publicArray.length === 1) ? publicArray[0] : publicArray;
}

/**
 * Load product and append to req.
 */
function load(req, res, next, tag) {
  Product.get(tag)
    .then((product) => {
      req.product = product; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Load Product Via Tag
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @param {string} tag - Tag assigned upon product DB entry
 */
function loadByTag(req, res, next, tag) {
  Product.findOne({ tag })
  .then((product) => {
    // eslint-disable-next-line no-param-reassign
    req.product = product;
    return next();
  })
  .catch(e => next(e));
}

/**
 * Get product
 * @returns {Product}
 */
function get(req, res) {
  return res.json(publicize(new Array(req.product)));
}

/**
 * Create new product
 * @property {string} req.body.tag - Tag ID used in store.
 * @property {string} req.body.name - User-friendly name of product.
 * @property {string} req.body.description - Paragraph containing relevant information.
 * @property {string} req.body.category - Name of main category.
 * @property {string} req.body.price - Number containing price.
 * @property {string} req.body.images - Array of URLs to images.
 * @property {string} req.body.taxExempt - Code containing reason for tax exemption, or left empty.
 * @property {string} req.body.comments - Administrator comments for dashboard use only.
 * @returns {Product}
 */
function create(req, res, next) {
  const user = req.user;
  if (!user.isAdmin) return next(new APIError('Must be Administrator', httpStatus.UNAUTHORIZED));
  const product = new Product({
    tag: req.body.tag,
    name: req.body.name,
    description: req.body.description,
    category: req.body.category,
    price: req.body.price,
    images: req.body.images,
    taxExempt: req.body.taxExempt,
    comments: req.body.comments
  });

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
 * @returns {Product[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  Product.list({ limit, skip })
    .then(products => res.json(publicize(new Array(products))))
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

module.exports = { load, loadByTag, get, create, update, list, remove };
