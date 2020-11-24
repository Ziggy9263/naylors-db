const express = require('express');
const expressJwt = require('express-jwt');
const config = require('../../config/config');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const orderCtrl = require('./order.controller');

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  /** GET /api/orders - Get list of orders */
  .get(orderCtrl.list)

  /** POST /api/orders - Create new order */
  .post(expressJwt({ secret: config.jwtSecret, algorithms: ['HS256'] }),
    validate(paramValidation.createOrder),
    orderCtrl.create);

router.route('/:uuid')
  /** GET /api/orders/:uuid - Get order */
  .get(orderCtrl.get)

  /** PUT /api/orders/:uuid - Update order */
  .put(expressJwt({ secret: config.jwtSecret, algorithms: ['HS256'] }),
    validate(paramValidation.updateOrder),
    orderCtrl.update)

  /** DELETE /api/orders/:uuid - Delete order */
  .delete(expressJwt({ secret: config.jwtSecret, algorithms: ['HS256'] }),
    orderCtrl.remove);

/** Load order when API with uuid route parameter is hit */
router.param('uuid', orderCtrl.load);

module.exports = router;
