const Order = require('./order.model');
const MX = require('../helpers/payments');
const productCtrl = require('../product/product.controller');
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
  const user = req.user;
  const orderData = {
    user: user._id,
    cartDetail: req.body.cartDetail,
    userComments: req.body.userComments,
    comments: req.body.comments
  };
  let amount = 0;
  let payInfo = {};
  await Promise.all(req.body.cartDetail.map(async (item) => {
    const product = await productCtrl.loadByTag(item.product);
    amount += item.quantity * product.price;
  })).then(() => {
    payInfo = { amount, ...req.body.paymentInfo };
  });
  return await MX.authorizePayment(payInfo).then((result) => {
    orderData.paymentInfo = {
      created: result.created,
      paymentToken: result.paymentToken,
      amount: result.amount,
      authCode: result.authCode
    };
    orderData.status = [{ msg: (result.status === 'Approved') ? 'Placed' : 'Error' }];
  }).finally(async () => {
    const order = new Order(orderData);

    try {
      const savedOrder = await order.save();
      return res.json(savedOrder);
    } catch (e) {
      return next(e);
    }
  });
}

/**
 * Update existing order
 * @property {string} req.param.uuid - The uuid of order.
 * @returns {Order}
 */
async function update(req, res, next) {
  // Notes for Dev: Do not allow update after payment complete.
  // const user = req.user;
  // if (!user.isAdmin) return next(new APIError('Must be Administrator', httpStatus.UNAUTHORIZED));
  const order = req.order;
  // TODO: Ensure that the only people updating are admin or the user that created it.
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
  /* TODO: Instead of blocking non-admin, unprivileged users should be able to cancel orders
  *  but not necessarily delete them. */
  if (!user.isAdmin) return next(new APIError('Must be Administrator', httpStatus.UNAUTHORIZED));
  const order = req.order;
  return order.remove()
    .then(deletedOrder => res.json(deletedOrder))
    .catch(e => next(e));
}

module.exports = { load, loadByUUID, get, create, update, list, remove };
