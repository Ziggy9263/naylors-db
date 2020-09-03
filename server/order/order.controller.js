const Order = require('./order.model');
const MX = require('../helpers/payments');
const productCtrl = require('../product/product.controller');
const User = require('../user/user.model');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');


/**
 * Remove sensitive data from an array of orders.
 * @param {Object<Order>[]} orderArray - Should be an array of mongoose objects
 * @returns {Object<Order>[]}
 */
function publicize(orderArray) {
  const publicArray = orderArray;
  orderArray.forEach((order, index) => {
    if ('comments' in order) delete publicArray[index].comments;
  });
  return (publicArray.length === 1) ? publicArray[0] : publicArray;
}

/**
 * Load order and append to req.
 */
function load(req, res, next, uuid) {
  Order.get(uuid)
    .then((order) => {
      req.order = order; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Load Order Via UUID
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @param {string} uuid - UUID assigned upon order DB entry
 */
function loadByUUID(req, res, next, uuid) {
  Order.findOne({ uuid })
  .exec()
  .then((order) => {
    // eslint-disable-next-line no-param-reassign
    req.order = order;
    return next();
  })
  .catch(e => next(e));
}

/**
 * Get order
 * @returns {Order}
 */
function get(req, res) {
  return res.json(publicize(new Array(req.order)));
}

/**
 * Create new order
 * @property {string} req.body.uuid - Tag ID used in store.
 * @property {string} req.body.name - User-friendly name of order.
 * @property {string} req.body.description - Paragraph containing relevant information.
 * @property {string} req.body.category - Name of main category.
 * @property {string} req.body.price - Number containing price.
 * @property {string} req.body.images - Array of URLs to images.
 * @property {string} req.body.taxExempt - Code containing reason for tax exemption, or left empty.
 * @property {string} req.body.comments - Administrator comments for dashboard use only.
 * @returns {Order}
 */
async function create(req, res, next) {
  var orderData = {};
  let calcs = {};
  try {
    calcs = await productCtrl.getTaxInfo(req.body.cartDetail)
      .then(tax => tax).catch(e => new Error(e));
    orderData = {
      user: await User.findOne({ email: req.user.email}).exec().then(u => u._doc._id).catch(e => new Error(e)),
      cartDetail: req.body.cartDetail,
      userComments: req.body.userComments,
      comments: req.body.comments,
      subtotal: calcs.subtotal,
      tax: calcs.tax
    };
  } catch(e) { next(new APIError(e, httpStatus.BAD_REQUEST)) };

  const payInfo = {
    amount: calcs.total,
    cardNumber: req.body.paymentInfo.cardNumber,
    expiryMonth: req.body.paymentInfo.expiryMonth,
    expiryYear: req.body.paymentInfo.expiryYear,
    cvv: req.body.paymentInfo.cvv,
    avsZip: req.body.paymentInfo.avsZip,
    avsStreet: req.body.paymentInfo.avsStreet
  };
  await MX.authorizePayment(payInfo).then((result) => {
    orderData.paymentInfo = {
      created: result.created,
      paymentToken: result.paymentToken,
      id: result.id,
      amount: result.amount,
      authCode: result.authCode
    };
    orderData.status = [{ msg: (result.status === 'Approved') ? 'Placed' : result }];
  });

  const order = new Order(orderData);

  await order.save()
    .then((savedOrder) => {
      res.json(savedOrder);
    })
    .catch((e) => next(e));
}

/**
 * Checks status array and returns object with booleans for status.
 * @param {array} status - Status field from order Model
 */
async function checkStatus(status) {
  var s = {
    authorized: false,
    paid: false,
    refunded: false,
    cancelled: false
  }
  await status.map((val) => {
    switch(val.msg) {
      case "Placed":
        s.authorized = true;
        break;
      case "Approved":
        s.paid = true;
        break;
      case "Partial Refund":
        s.refunded = true;
        break;
      case "Cancelled":
        s.cancelled = true;
        break;
    }
  });
  return s;
}

/**
 * Update existing order
 * @property {string} req.param.uuid - The uuid of order.
 * @returns {Order}
 */
async function update(req, res, next) {
  // TODO: Secure access to admin and owner of order.
  const order = req.order;
  var status = await checkStatus(order.status);
  let finalize = (req.body.finalize && !status.paid) ? true : false;
  var orderData = {};
  var calcs = { new: {}, old: {}, diff: false };
  try {
    calcs.new = await productCtrl.getTaxInfo(req.body.cartDetail)
      .then(detail => detail).catch(e => new Error(e));
    calcs.old = await productCtrl.getTaxInfo(order.cartDetail)
      .then(detail => detail).catch(e => new Error(e));
  if (calcs.new !== calcs.old) calcs.diff = true;
  } catch(e) { next(new APIError(e, httpStatus.BAD_REQUEST)) };
    /**
     * Must ensure that payment has not been completed, if it has:
     * - Use the partial refund function from payments.js
     * And if it has not:
     * - Change order in saved model, no need to call to MX API
     * However, if finalize param is true:
     * - Change order in saved model and finalize with new cart
     */
  let amount = 0;
  let payInfo = {};
  if (order.cartDetail !== req.body.cartDetail) order.cartDetail = req.body.cartDetail;

  await Promise.all(req.body.cartDetail.map(async (item) => {
    const product = await productCtrl.loadByTag(item.product);
    amount += item.quantity * product.price;
  })).then(() => {
    payInfo = {
      amount,
      authCode: order.paymentInfo[0].authCode,
      paymentToken: order.paymentInfo[0].paymentToken
    };
  });
  order.userComments = req.body.userComments;
  order.comments = req.body.comments;

  if (req.body.finalize) {
    return await MX.finalizePayment(payInfo).then((result) => {
      if (result.status === 'Approved') {
        order.paymentInfo.push({
          created: result.created,
          paymentToken: result.paymentToken,
          amount: result.amount,
          authCode: result.authCode
        });
      }
      order.status.push({ msg: (result.status === 'Approved') ? 'Completed' : result });
    }).finally(async () => {
      try {
        const savedOrder = await order.save();
        return res.json(savedOrder);
      } catch (e) {
        return next(e);
      }
    });
  }
  return order.save()
    .then(savedOrder => res.json(savedOrder))
    .catch(e => next(e));
}

/**
 * Get order list.
 * @property {number} req.query.skip - Number of orders to be skipped.
 * @property {number} req.query.limit - Limit number of orders to be returned.
 * @returns {Order[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  Order.list({ limit, skip })
    .then(orders => res.json(publicize(new Array(orders))))
    .catch(e => next(e));
}

/**
 * Delete order.
 * @returns {Order}
 */
function remove(req, res, next) {
  const user = req.user;
  const order = req.order;
  await
  if(user.isAdmin) {
    return order.remove()
      .then(deletedOrder => res.json(deletedOrder))
      .catch(e => next(e));
  }
}

module.exports = { load, loadByUUID, get, create, update, list, remove };
