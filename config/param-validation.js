const Joi = require('joi');

module.exports = {
  // POST /api/users
  createUser: {
    body: {
      email: Joi.string().required(),
      password: Joi.string().required(),
      name: Joi.string().required(),
      phone: Joi.string().regex(/\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/).default(null),
      business: Joi.string().default(null),
      address: Joi.string().default(null),
      taxExempt: Joi.string().default(null),
      isAdmin: Joi.boolean().default(false),
      adminVerification: Joi.string().default(null),
      comments: Joi.string().default(null)
    }
  },

  // UPDATE /api/users/:userId
  updateUser: {
    body: {
      email: Joi.string(),
      phone: Joi.string().regex(/\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/),
      password: Joi.string(),
      name: Joi.string(),
      business: Joi.string(),
      address: Joi.string(),
      taxExempt: Joi.string(),
      isAdmin: Joi.boolean(),
      adminVerification: Joi.string(),
      comments: Joi.string()
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
