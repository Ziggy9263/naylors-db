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
 * @param {Number} tag - Tag assigned upon product DB entry
 * @returns {Promise<Object|APIError>}
 */
function loadByTag(tag) {
  return Product.get(tag)
  .then(product => Promise.resolve(product))
  .catch(e => Promise.reject(new APIError(e, httpStatus.INTERNAL_SERVER_ERROR)));
}

/**
 * Returns price * quantity
 * @param {Object[]} cartDetail - An array of objects with product tag and quantity
 * @returns {Promise}
 */
function getSubTotal(cartDetail) {
  const subtotal = cartDetail.map((item) => {
    const quantity = item.quantity;
    return Product.get(item.product)
      .then(product => quantity * product.price)
      .catch(e => e);
  });
  return Promise.all(subtotal).then((value) => {
    if (!value.every(item => typeof item === 'number')) {
      return Promise.reject(new APIError('Product Not Found', httpStatus.BAD_REQUEST));
    }
    return Promise.resolve(value.reduce((a, b) => a + b, 0));
  });
}

function getTaxInfo(cartDetail) {
  const taxInfo = cartDetail.map((item) => {
    return Product.get(item.product)
      .then((product) => { return { taxExempt: product.taxExempt, price: product.price, quantity: item.quantity }; })
      .catch(e => e);
  });
  return Promise.all(taxInfo).then((value) => {
    console.log(value);
    if (!value.every(item => typeof item.taxExempt === 'boolean')) {
      return Promise.reject(new APIError('Product Not Found', httpStatus.BAD_REQUEST));
    }
    console.log(`getTaxInfo - value: ${JSON.stringify(value)}\ngetTaxInfo - value.length: ${value.length}`);
    if (value.length === 1) {
      tax = ((value[0].taxExempt) ? Math.round(((value[0].price * value[0].quantity) * 0.0825) * 1e2) / 1e2 : 0);
      subtotal = Math.round((value[0].price * value[0].quantity) * 1e2) / 1e2;
      total = Math.round((tax + subtotal) * 1e2) / 1e2;
      return Promise.resolve({ tax, subtotal, total})
        .then((result) => { console.log(`getTaxInfo - l1: ${JSON.stringify(result)}`); return result; });
    }
    if (value.length >= 1) {
      return Promise.resolve(value.reduce((a, b) => {
        tax = ((!a.taxExempt) ? Math.round(((a.price * a.quantity) * 0.0825) * 1e2) / 1e2 : 0)
          + ((!b.taxExempt) ? Math.round(((b.price * b.quantity) * 0.0825) * 1e2) / 1e2 : 0);
        subtotal = Math.round(((a.price * a.quantity) + (b.price * b.quantity)) * 1e2) / 1e2;
        total = Math.round((tax + subtotal) * 1e2) / 1e2;
        return { tax, subtotal, total }
      })).then((result) => { console.log(`getTaxInfo - ln: ${JSON.stringify(result)}`) ; return result; });
    }
  })
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
    sizes: req.body.sizes, // [ { size: "50lbs", tag: 36009 }, ... ]
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

module.exports = { load, loadByTag, getSubTotal, getTaxInfo, get, create, update, list, remove };
