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
function publicize(orderArray, isAdmin = false) {
  const publicArray = orderArray;
  orderArray.forEach((order, index) => {
    if ('comments' in order && !isAdmin) delete publicArray[index].comments;
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
      .then(detail => detail).catch(e => { throw { e }; });
    orderData = {
      user: await User.findOne({ email: req.user.email}).exec().then(u => u._doc._id).catch(e => new Error(e)),
      cartDetail: req.body.cartDetail,
      userComments: req.body.userComments,
      comments: req.body.comments
    };
  } catch(e) { next(new APIError(e, httpStatus.BAD_REQUEST)) };
    var payOption = req.body.paymentInfo.payOption;
  const payInfo = (payOption === "WithCard") ? {
    amount: calcs.total,
    tax: calcs.tax,
    cardNumber: req.body.paymentInfo.cardNumber,
    expiryMonth: req.body.paymentInfo.expiryMonth,
    expiryYear: req.body.paymentInfo.expiryYear,
    cvv: req.body.paymentInfo.cvv,
    avsZip: req.body.paymentInfo.avsZip,
    avsStreet: req.body.paymentInfo.avsStreet,
    payOption: payOption
  } : { amount: calcs.total, tax: calcs.tax, payOption: payOption };
  if (payOption === "WithCard") {
    await MX.authorizePayment(payInfo).then((result) => {
      orderData.payHistory = [{
        status: (result.status === 'Approved') ? 'Placed' : result,
        _ref: {
          created: result.created,
          paymentToken: result.paymentToken,
          id: result.id,
          amount: result.amount,
          tax: result.tax,
          authCode: result.authCode,
          payOption: payOption
        }
      }];
    });
  } else if (payOption === "InStore") {
    console.log(`OrderPaymentInStore - ${payInfo.amount}, ${payInfo.tax}, ${payInfo.payOption}`);
    orderData.payHistory = [{ status: 'Placed', _ref: {
      amount: payInfo.amount,
      tax: payInfo.tax,
      payOption: payInfo.payOption
    } }];
  } else {
    return next(APIError('payOption invalid'));
  }

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
    cancelled: false,
    edited: false
  }
  status.map((val) => {
    switch (val.status) {
      case "Placed":
        s.authorized = true;
        break;
      case "Completed":
        s.paid = true;
        break;
      case "Partial Refund":
        s.refunded = true;
        break;
      case "Cancelled":
        s.cancelled = true;
        break;
      case "Edited":
        s.edited = true;
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
  var status = await checkStatus(order.payHistory);
  let finalize = (req.body.finalize === true) ? true : false;
  var orderData = {};
  var calcs = { new: {}, old: {}, diff: false, change: 0 };
  try {
    calcs.new = await productCtrl.getTaxInfo(req.body.cartDetail)
      .then(detail => detail).catch(e => new Error(e));
    calcs.old = await productCtrl.getTaxInfo(order.cartDetail)
      .then(detail => detail).catch(e => new Error(e));
    calcs.diff = JSON.stringify(calcs.new) !== JSON.stringify(calcs.old);
    calcs.change = (calcs.diff) ? Math.round((calcs.new.total - calcs.old.total) * 1e2) / 1e2 : 0;
  } catch(e) { next(new APIError(e, httpStatus.BAD_REQUEST)) };
  console.log(`PUT /api/orders/:uuid - Calcs: ${JSON.stringify(calcs)}`);
    /**
     * Ensures that payment has not been completed, if it has:
     * - Use the partial refund function from payments.js
     * And if it has not:
     * - Change order in saved model, no need to call to MX API
     * However, if finalize param is true:
     * - Change order in saved model and finalize with new cart
     */
  const payHistory = await order.payHistory[0];
  if (status.cancelled) {
    next(new APIError('Order was previously cancelled.',
      httpStatus.BAD_REQUEST));
  }
  if (!status.authorized) {
    next(new APIError('Order has not been authorized.',
      httpStatus.BAD_GATEWAY));
  }
  if (status.paid && finalize) {
    next(new APIError('Cannot finalize paid transaction.',
      httpStatus.BAD_REQUEST));
  }
  if (status.authorized && !status.paid && !finalize) { // Edit Only
    order.payHistory.push({
      status: 'Edited',
      _ref: {
        amount: calcs.new.total,
        tax: calcs.new.tax
      }
    })
  }
  if (status.paid && calcs.diff) { // Partial Refund Or Payment
    let refundInfo = {
      amount: calcs.change,
      tax: calcs.new.tax,
      paymentToken: payHistory._ref.paymentToken
    }
    await MX.refundPartial(refundInfo).then((result) => {
      if (result.status === 'Approved') {
        order.payHistory.push({
          status: (result.status === 'Approved') ? 'Partial Refund' : result,
          _ref: {
            created: result.created,
            paymentToken: result.paymentToken,
            id: result.id,
            amount: result.amount,
            tax: result.tax,
            authCode: result.authCode
          }
        })
      }
    })
  }
  if (!status.paid && finalize) { // Finalize
    let payInfo = {
      amount: calcs.new.total,
      tax: calcs.new.tax,
      paymentToken: payHistory._ref.paymentToken,
      authCode: payHistory._ref.authCode
    }
    await MX.finalizePayment(payInfo).then((result) => {
      if (result.status === 'Approved') {
        order.payHistory.push({
          status: (result.status === 'Approved') ? 'Completed' : result,
          _ref: {
            created: result.created,
            paymentToken: result.paymentToken,
            id: result.id,
            amount: result.amount,
            tax: result.tax,
            authCode: result.authCode
          }
        });
      }
    });
  }
  if (calcs.diff) {
    order.cartDetail = req.body.cartDetail;
    order.userComments = req.body.userComments;
    order.comments = req.body.comments;
  }
  order.userComments = req.body.userComments;
  order.comments = req.body.comments;

  order.save()
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
  var user = req.user;
  const { limit = 50, skip = 0, admin = false } = req.query;

  (admin && user.isAdmin)
  ? Order.list({ limit, skip })
    .then(orders => res.json(publicize(new Array(orders), isAdmin = true)))
    .catch(e => next(e))
  : Order.list({ limit, skip, user = user._id })
    .then(orders => res.json(publicize(new Array(orders))))
    .catch(e => next(e));
}

/**
 * Takes payHistory and calculates proper refund OR returns 0 if refund not allowed.
 * @param {array} refundAmount - Amount to be refunded.
 */
async function calculateRefund(payHistory) {
  var s = {
    authorized: false,
    paid: false,
    refunded: false,
    cancelled: false,
    edited: false
  }
  var refundAmount = 0;
  var taxAmount = 0;
  var unAuthCancel = true; // Un-Authorized Cancel - False if the cancellation would be a mistake, or cause issues.
  var reason = null;
  var payToken = null;
  await payHistory.map((val) => {
    var amount = val._ref.amount;
    var tax = val._ref.tax;
    switch(val.status) {
      case "Placed":
        s.authorized = true;
        refundAmount = amount;
        taxAmount = tax;
        payToken = val._ref.paymentToken;
        break;
      case "Edited":
        s.edited = true;
        refundAmount = amount;
        taxAmount = tax;
        break;
      case "Completed":
        s.paid = true;
        refundAmount = amount;
        taxAmount = tax;
        unAuthCancel = false;
        reason = 'Order has been completed.'
        break;
      case "Partial Refund":
        s.refunded = true;
        refundAmount += amount;
        taxAmount -= tax;
        break;
      case "Cancelled":
        s.cancelled = true;
        refundAmount = 0;
        taxAmount = 0;
        unAuthCancel = false;
        reason = 'Order has previously been cancelled.'
        break;
    }
  });
  var retObj = {
    refundAmount: Math.round(-refundAmount * 1e2) / 1e2,
    taxAmount: Math.round(taxAmount * 1e2) / 1e2,
    payToken,
    unAuthCancel,
    reason
  }
  if (s.authorized && !s.paid) {
    retObj.unAuthCancel = false;
    retObj.reason = 'Payment never processed.'
  }
  return retObj;
}

/**
 * Delete order.
 * @returns {Order}
 */
async function remove(req, res, next) {
  const totalDelete = req.query.total;
  const user = req.user;
  const order = req.order;
  const payHistory = order.payHistory;
  const refundCalc = await calculateRefund(payHistory);

  payId = payHistory[payHistory.length - 1]._ref.id;
  /** TODO: Follow the same switch technique used in UPDATE to ensure that refunds only work
   * on orders that have not been fully completed, and that if so, the order is calculated
   * totally, including any refunds that have already happened.
   */
  if(!refundCalc.unAuthCancel) {
    if(order.payHistory[order.payHistory.length - 1].status === 'Cancelled') {
      return res.json({ deleted: false, reason: refundCalc.reason });
    } else if(refundCalc.reason === 'Payment never processed.') {
      order.payHistory.push({
        status: 'Cancelled'
      });
      return await order.save()
        .then(savedOrder => res.json(savedOrder))
        .catch(e => next(e));
    } else
      res.json({ deleted: false, reason: refundCalc.reason })
  }
  if(refundCalc.unAuthCancel || (refundCalc.unAuthCancel && user.isAdmin)) {
    let refundInfo = {
      amount: refundCalc.refundAmount,
      tax: refundCalc.taxAmount,
      paymentToken: refundCalc.payToken
    }
    await MX.refundPartial(refundInfo).then((result) => {
      if (result.status === 'Approved') {
        order.payHistory.push({
          status: (result.status === 'Approved') ? 'Cancelled' : result,
          _ref: {
            created: result.created,
            paymentToken: result.paymentToken,
            id: result.id,
            amount: result.amount,
            tax: result.tax,
            authCode: result.authCode
          }
        })
      }
    })
  }
  if((!user.isAdmin && !totalDelete) || (user.isAdmin && !totalDelete)) {
    await order.save()
      .then(savedOrder => res.json(savedOrder))
      .catch(e => next(e));
  }
  if(user.isAdmin && totalDelete) {
    // Consider implementing a specific toggle for this function requiring admin
    await order.remove()
      .then(deletedOrder => res.json({ deleted: true, deletedOrder }))
      .catch(e => next(e));
  }
}

module.exports = { load, loadByUUID, get, create, update, list, remove };
