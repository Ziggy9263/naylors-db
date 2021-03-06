const mongoose = require('mongoose');
const Promise = require('bluebird');
mongoose.Promise = require('bluebird');
const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');

/**
 * Category Schema
 */
const CategorySchema = new mongoose.Schema({
  code: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  updatedLast: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  comments: {
    type: String,
    default: undefined
  }
});

/**
 * Fuzzy Searching Capability via mongoose-fuzzy-searching plugin
 */
CategorySchema.plugin(mongoose_fuzzy_searching, { fields: ['name'] });

/**
 * Statics
 */
CategorySchema.statics = {
  /**
   * Get category
   * @param {String} id - The id of category.
   * @returns {Promise<Category, APIError>}
   */
  get(_id) {
    return this.findOne({ _id })
      .exec()
      .then((category) => {
        if (!category) {
          const err = new APIError('No such category exists!', httpStatus.NOT_FOUND);
          return Promise.reject(err);
        }
        return Promise.resolve(category);
      });
  },

  /**
   * List categories in descending order of 'code'.
   * @param {number} skip - Number of categories to be skipped.
   * @param {number} limit - Limit number of categories to be returned.
   * @returns {Promise<Category[]>}
   */
  list({ skip = 0, limit = 50 } = {}) {
    return this.find({})
      .populate({
        path: 'department'
      })
      .sort({ code: 1 })
      .skip(+skip)
      .limit(+limit)
      .exec();
  }
};

/**
 * @typedef Category
 */
module.exports = mongoose.model('Category', CategorySchema, 'categories');
