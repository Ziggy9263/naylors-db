const mongoose = require('mongoose');
const Promise = require('bluebird');
mongoose.Promise = require('bluebird');
const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching');
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
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
  root: {
    type: Boolean,
    default: true
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
ProductSchema.plugin(mongoose_fuzzy_searching, { fields: ['name', 'description'] });

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
      .populate({
        path: 'category',
        populate: { path: 'department' },
      })
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
   * @returns {Promise<Product[]>}
   */
  list({ skip = 0, limit = 50, root = null } = {}) {
    return this.find((root) ? { root } : {})
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
