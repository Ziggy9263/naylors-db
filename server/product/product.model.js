const mongoose = require('mongoose');
const Promise = require('bluebird');
mongoose.Promise = require('bluebird');
const mongoose_fuzzy_searching = require('mongoose_fuzzy_searching');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');

/**
 * Product Schema
 */
const ProductSchema = new mongoose.Schema({
  tag: {
    type: Number,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  images: {
    type: Array,
    default: []
  },
  sizes: {
    type: Array,
    default: [{
      size: { type: String },
      tag: { type: String }
    }]
  },
  updatedLast: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  taxExempt: {
    type: Boolean,
    default: false
  },
  comments: {
    type: String,
    default: undefined
  }
});

/**
 * Fuzzy Searching Capability via mongoose-fuzzy-searching plugin
 */
ProductSchema.plugin(mongoose_fuzzy_searching, { fields: ['name', 'description', 'category', 'tag'] });

/**
 * Statics
 */
ProductSchema.statics = {
  /**
   * Get product
   * @param {Number} tag - The tag of product.
   * @returns {Promise<Product, APIError>}
   */
  get(tag) {
    return this.findOne({ tag })
      .exec()
      .then((product) => {
        if (!product) {
          const err = new APIError('No such product exists!', httpStatus.NOT_FOUND);
          return Promise.reject(err);
        }
        return Promise.resolve(product);
      });
  },

  /**
   * List products in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of products to be skipped.
   * @param {number} limit - Limit number of products to be returned.
   * @param {string} q - Query for searching products
   * @returns {Promise<Product[]>}
   */
  list({ skip = 0, limit = 50, q = null } = {}) {
    if (q != null) return this.fuzzySearch(q)
      .skip(+skip)
      .limit(+limit)
      .exec();
    if (q == null) return this.find()
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec();
  }
};

/**
 * @typedef Product
 */
module.exports = mongoose.model('Product', ProductSchema, 'products');
