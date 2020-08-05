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
  let unprivilegedAuthHeader;
  let privilegedAuthHeader;

  before((done) => {
    // Get unprivileged JWT token.
    request(app)
      .post('/api/auth/login')
      .send({
        email: 'bigz93@gmail.com',
        password: 'BigZ93lmao' })
      .expect(httpStatus.OK)
      .then((res) => {
        unprivilegedAuthHeader = res.body.token;
      })
      .catch(done);
    // Get privileged JWT token.
    request(app)
      .post('/api/auth/login')
      .send({
        email: 'bigz94@gmail.com',
        password: 'BigZ94lmao' })
      .expect(httpStatus.OK)
      .then((res) => {
        privilegedAuthHeader = res.body.token;
      })
      .catch(done);
    done();
  });

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
    it('should fail to create a new product due to invalid token', (done) => {
      request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer lkjfhsdjlkfhg')
        .send(product)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });
    it('should fail to create a new product due to lack of admin', (done) => {
      request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${unprivilegedAuthHeader}`)
        .send(product)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });
    it('should create a new product', (done) => {
      request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${privilegedAuthHeader}`)
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
    it('should fail to update product due to invalid token', (done) => {
      request(app)
        .put('/api/products/133790')
        .set('Authorization', 'Bearer lkjfhsdjlkfhg')
        .send(product)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });
    it('should fail to update product details due to lack of admin', (done) => {
      product.tag = 173359;
      request(app)
        .put('/api/products/133790')
        .send(product)
        .set('Authorization', `Bearer ${unprivilegedAuthHeader}`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });
    it('should update product details', (done) => {
      product.tag = 173359;
      request(app)
        .put('/api/products/133790')
        .send(product)
        .set('Authorization', `Bearer ${privilegedAuthHeader}`)
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
    it('should fail to delete product due to invalid token', (done) => {
      request(app)
        .delete(`/api/products/${product.tag}`)
        .set('Authorization', 'Bearer lksjdhgsf')
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });
    it('should fail to delete product due to missing token', (done) => {
      request(app)
        .delete(`/api/products/${product.tag}`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });
    it('should fail to delete product due to lack of admin', (done) => {
      request(app)
        .delete(`/api/products/${product.tag}`)
        .set('Authorization', `Bearer ${unprivilegedAuthHeader}`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });
    it('should delete product', (done) => {
      request(app)
        .delete(`/api/products/${product.tag}`)
        .set('Authorization', `Bearer ${privilegedAuthHeader}`)
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
