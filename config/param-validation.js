const Joi = require('joi');

module.exports = {
  // POST /api/users
  createUser: {
    body: {
      email: Joi.string().required(),
      password: Joi.string().required(),
      name: Joi.string().required(),
      phone: Joi.string().regex(/^[1-9][0-9]{9}$/)
    }
  },

  // UPDATE /api/users/:userId
  updateUser: {
    body: {
      email: Joi.string().required(),
      phone: Joi.string().regex(/^[1-9][0-9]{9}$/).required()
    },
    params: {
      userId: Joi.string().hex().required()
    }
  },

  // POST /api/auth/login
  login: {
    body: {
      email: Joi.string().required(),
      password: Joi.string().required()
    }
  },

  // GET /api/auth/verify/:token
  verify: {
    params: {
      token: Joi.string().required()
    }
  },

  // POST /api/products
  createProduct: {
    body: {
      tag: Joi.number().required(),
      name: Joi.string().required(),
      description: Joi.string(),
      category: Joi.string(),
      price: Joi.number().required(),
      images: Joi.array(),
      taxExempt: Joi.string(),
      comments: Joi.string()
    }
  },

  // PUT /api/products/:tag
  updateProduct: {
    body: {
      tag: Joi.number().required(),
      name: Joi.string().required(),
      description: Joi.string(),
      category: Joi.string(),
      price: Joi.number().required(),
      images: Joi.array(),
      taxExempt: Joi.string(),
      comments: Joi.string()
    },
    params: {
      tag: Joi.number().required()
    }
  }
};
