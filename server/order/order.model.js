const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const _uuid = require('uuid');

/**
 * Order Schema
 */
const OrderSchema = new mongoose.Schema({
  uuid: {
    type: String,
    unique: true,
    required: true,
    default: function genUUID() {
      return _uuid.v4();
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cartDetail: [{
    product: Number,
    quantity: Number
  }],
  /**
   * payHistory Array of Objects
   *  status        - Message for client to use, e.g. "Placed", "Completed", "Cancelled", etc.
   *  _ref {        - Reference to the MX Merchant API response
   *   created      - Stores timestamp from MX Merchant API call
   *   paymentToken - reference MX Merchant API
   *   id           - reference MX Merchant API
   *   amount       - Total amount
   *   tax          - Tax amount
   *   authCode     - authCode sent in sale authorization used for finalization
   *  }
   *  ts            - Timestamp set on creation of the status in Mongoose.
   */
  payHistory: [{
    status: { type: String, required: true },
    _ref: {
      created: Date,
      paymentToken: String,
      id: Number,
      amount: Number,
      tax: Number,
      authCode: String,
      payOption: String
    },
    ts: { type: Date, default: Date.now }
  }],
  updatedLast: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  userComments: {
    type: String,
  },
  comments: {
    type: String,
    default: undefined
  }
}, {
  usePushEach: true
});

/**
 * Pre Save Hook
 */
OrderSchema.pre('save', function(next) {
  this.updatedLast = Date.now();
  next();
})

/**
 * Statics
 */
OrderSchema.statics = {
  /**
   * Get order
   * @param {Number} uuid - The uuid of order.
   * @returns {Promise<Order, APIError>}
   */
  get(uuid) {
    return this.findOne({ uuid })
      .exec()
      .then((order) => {
        if (order) {
          return order;
        }
        const err = new APIError('No such order exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List orders in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of orders to be skipped.
   * @param {number} limit - Limit number of orders to be returned.
   * @returns {Promise<Order[]>}
   */
  list({ skip = 0, limit = 50, user = null } = {}) {
    return this.find((user != null) ? {'user': user} : {})
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec();
  }
};

/**
 * @typedef Order
 */
module.exports = mongoose.model('Order', OrderSchema, 'orders');
