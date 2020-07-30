const mongoose = require('mongoose');
const request = require('supertest-as-promised');
const httpStatus = require('http-status');
const chai = require('chai'); // eslint-disable-line import/newline-after-import
const expect = chai.expect;
const app = require('../../index');

chai.config.includeStack = true;

/**
 * root level hooks
 */
after((done) => {
  // clean up for next tests
  mongoose.connection.db.collection('products').deleteMany({ tag: '173359' });
  done();
});

describe('## Product APIs', () => {
  let product = {
    tag: 133790,
    name: 'Scratch',
    description: 'For Scratching Chickens',
    category: 'Feed',
    price: 10.95,
    images: [],
    taxExempt: undefined,
    comments: 'Test test 1 2 3'
  };

  describe('# POST /api/products', () => {
    it('should create a new product', (done) => {
      request(app)
        .post('/api/products')
        .send(product)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.tag).to.equal(product.tag);
          expect(res.body.name).to.equal(product.name);
          product = res.body;
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/products/:tag', () => {
    it('should get product details', (done) => {
      request(app)
        .get(`/api/products/${product.tag}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.tag).to.equal(product.tag);
          expect(res.body.name).to.equal(product.name);
          done();
        })
        .catch(done);
    });

    it('should report error with message - Not found, when product does not exists', (done) => {
      request(app)
        .get('/api/products/133791')
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.message).to.equal('Not Found');
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /api/products/:tag', () => {
    it('should update product details', (done) => {
      product.tag = 173359;
      request(app)
        .put('/api/products/133790')
        .send(product)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.tag).to.equal(173359);
          expect(res.body.name).to.equal(product.name);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/products/', () => {
    it('should get all products', (done) => {
      request(app)
        .get('/api/products')
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.be.an('array');
          done();
        })
        .catch(done);
    });

    it('should get all products (with limit and skip)', (done) => {
      request(app)
        .get('/api/products')
        .query({ limit: 10, skip: 1 })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.be.an('array');
          done();
        })
        .catch(done);
    });
  });

  describe('# DELETE /api/products/', () => {
    it('should delete product', (done) => {
      request(app)
        .delete(`/api/products/${product.tag}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.tag).to.equal(product.tag);
          expect(res.body.name).to.equal(product.name);
          done();
        })
        .catch(done);
    });
  });
});
