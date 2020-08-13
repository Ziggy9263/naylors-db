const express = require('express');
const userRoutes = require('./server/user/user.route');
const authRoutes = require('./server/auth/auth.route');
const productRoutes = require('./server/product/product.route');
const orderRoutes = require('./server/order/order.route');

const router = express.Router(); // eslint-disable-line new-cap

// TODO: use glob to match *.route files

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
  res.send('OK')
);

// mount user routes at /users
router.use('/users', userRoutes);

// mount auth routes at /auth
router.use('/auth', authRoutes);

// mount product routes at /products
router.use('/products', productRoutes);

// mount order routes at /orders
router.use('/orders', orderRoutes);


module.exports = router;
