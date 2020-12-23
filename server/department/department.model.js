const mongoose = require('mongoose');
const Promise = require('bluebird');
mongoose.Promise = require('bluebird');
const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');

/**
 * Department Schema
 */
const DepartmentSchema = new mongoose.Schema({
  code: {
    type: Number,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  categories: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Category'
    }
  ],
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
DepartmentSchema.plugin(mongoose_fuzzy_searching, { fields: ['name'] });

/**
 * Statics
 */
DepartmentSchema.statics = {
  /**
   * Get department
   * @param {Number} code - The code for department.
   * @returns {Promise<Department, APIError>}
   */
  get(code) {
    return this.findOne({ code })
      .exec()
      .populate('categories')
      .then((department) => {
        if (!department) {
          const err = new APIError('No such department exists!', httpStatus.NOT_FOUND);
          return Promise.reject(err);
        }
        return Promise.resolve(product);
      });
  },

  /**
   * List departments in descending order of 'code'.
   * @param {number} skip - Number of entries to be skipped.
   * @param {number} limit - Limit number of entries to be returned.
   * @returns {Promise<Department[]>}
   */
  list({ skip = 0, limit = 50, root = null } = {}) {
    return this.find({})
      .populate('categories')
      .sort({ code: 1 })
      .skip(+skip)
      .limit(+limit)
      .exec();
  }
};

/**
 * @typedef Department
 */
module.exports = mongoose.model('Department', DepartmentSchema, 'departments');
