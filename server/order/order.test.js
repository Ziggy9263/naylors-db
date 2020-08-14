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
  mongoose.connection.db.collection('orders').deleteMany({ });
  done();
});

describe('## Order APIs', () => {
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

  let order = {
    cartDetail: [{
      product: 133790,
      quantity: 3
    }],
    userComments: 'Test test 1 2 3'
  };

  describe('# POST /api/orders', () => {
    it('should fail to create a new order due to invalid token', (done) => {
      request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer lkjfhsdjlkfhg')
        .send(order)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });
    it('should create a new order', (done) => {
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${unprivilegedAuthHeader}`)
        .send(order)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.cartDetail);
          expect(res.body.userComments).to.equal(order.userComments);
          order = res.body;
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/orders/:uuid', () => {
    it('should get order details', (done) => {
      request(app)
        .get(`/api/orders/${order.uuid}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.uuid).to.equal(order.uuid);
          expect(res.body.cartDetail);
          expect(res.body.userComments).to.equal(order.userComments);
          done();
        })
        .catch(done);
    });

    it('should report error with message - Not found, when order does not exists', (done) => {
      request(app)
        .get('/api/orders/4983567-2039468-239076-2597')
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.message).to.equal('Not Found');
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /api/orders/:uuid', () => {
    it('should fail to update order due to invalid token', (done) => {
      request(app)
        .put(`/api/orders/${order.uuid}`)
        .set('Authorization', 'Bearer lkjfhsdjlkfhg')
        .send(order)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });
    it('should fail to update order details due to lack of valid token', (done) => {
      order.userComments = "Actually, I'll be there at around 3 on Thursday.";
      request(app)
        .put(`/api/orders/${order.uuid}`)
        .send(order)
        .set('Authorization', `Bearer lsdkjfghldfjghlsds`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });
    it('should update order details', (done) => {
      order.userComments = "Actually, I'll be there at around 3 on Thursday.";
      request(app)
        .put(`/api/orders/${order.uuid}`)
        .send(order)
        .set('Authorization', `Bearer ${unprivilegedAuthHeader}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.uuid).to.equal(order.uuid);
          expect(res.body.cartDetail);
          expect(res.body.userComments).to.equal(order.userComments);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/orders/', () => {
    it('should get all orders', (done) => {
      request(app)
        .get('/api/orders')
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.be.an('array');
          done();
        })
        .catch(done);
    });

    it('should get all orders (with limit and skip)', (done) => {
      request(app)
        .get('/api/orders')
        .query({ limit: 10, skip: 1 })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.be.an('array');
          done();
        })
        .catch(done);
    });
  });

  describe('# DELETE /api/orders/', () => {
    it('should fail to delete order due to invalid token', (done) => {
      request(app)
        .delete(`/api/orders/${order.uuid}`)
        .set('Authorization', 'Bearer lksjdhgsf')
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });
    it('should fail to delete order due to missing token', (done) => {
      request(app)
        .delete(`/api/orders/${order.uuid}`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });
    it('should fail to delete order due to lack of admin', (done) => {
      request(app)
        .delete(`/api/orders/${order.uuid}`)
        .set('Authorization', `Bearer ${unprivilegedAuthHeader}`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });
    it('should delete order', (done) => {
      request(app)
        .delete(`/api/orders/${order.uuid}`)
        .set('Authorization', `Bearer ${privilegedAuthHeader}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.uuid).to.equal(order.uuid);
          expect(res.body.cartDetail);
          expect(res.body.userComments).to.equal(order.userComments);
          done();
        })
        .catch(done);
    });
  });
});