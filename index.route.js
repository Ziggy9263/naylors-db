const express = require('express');
const userRoutes = require('./server/user/user.route');
const authRoutes = require('./server/auth/auth.route');
const productRoutes = require('./server/product/product.route');
const orderRoutes = require('./server/order/order.route');
const categoryRoutes = require('./server/category/category.route');
const departmentRoutes = require('./server/department/department.route');
//const imageRoutes = require('./server/image/image.route');

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

// mount category routes at /categories
router.use('/categories', categoryRoutes);

// mount department routes at /categories
router.use('/departments', departmentRoutes);

// mount order routes at /orders
router.use('/orders', orderRoutes);

// mount image upload route at /image
//router.use('/images', imageRoutes);

module.exports = router;
