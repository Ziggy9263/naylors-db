const request = require('supertest-as-promised');
const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const chai = require('chai'); // eslint-disable-line import/newline-after-import
const expect = chai.expect;
const app = require('../../index');
const User = require('../user/user.model');
const config = require('../../config/config');
const uuid = require('uuid');

chai.config.includeStack = true;

const validUserCredentials = {
  email: 'BigZ93@gmail.com',
  password: 'BigZ93lmao'
};
const invalidUserCredentials = {
  email: 'BigZ93@gmail.com',
  password: 'IDontKnow'
};
let verification;

before((done) => {
  // Create unprivileged user
  verification = uuid.v4();
  const user = new User({
    email: 'BigZ93@gmail.com',
    password: 'BigZ93lmao',
    name: 'Jerry Smith',
    verification
  });
  user.save();
  // Create privileged user
  const admin = new User({
    email: 'BigZ94@gmail.com',
    password: 'BigZ94lmao',
    name: 'Beth Smith',
    verification,
    isAdmin: true,
    adminVerification: config.adminCode
  });
  admin.save();
  done();
});

describe('## Auth APIs', () => {
  let jwtToken;

  describe('# POST /api/auth/login', () => {
    it('should return Bad Request', (done) => {
      request(app)
        .post('/api/auth/login')
        .send(invalidUserCredentials)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          expect(res.body.message).to.equal('Bad Request');
          done();
        })
        .catch(done);
    });

    it('should get valid JWT token', (done) => {
      request(app)
        .post('/api/auth/login')
        .send(validUserCredentials)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('token');
          jwt.verify(res.body.token, config.jwtSecret, (err, decoded) => {
            expect(err).to.not.be.ok; // eslint-disable-line no-unused-expressions
            expect(decoded.email).to.equal(validUserCredentials.email.toLowerCase());
            jwtToken = `Bearer ${res.body.token}`;
            done();
          });
        })
        .catch(done);
    });
  });

  describe('# GET /api/auth/verify/:token', () => {
    it('should return Bad Request with invalid token', (done) => {
      request(app)
        .get('/api/auth/verify/879df6g-876g6-d67g876-8s79dg')
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          expect(res.body.message).to.equal('Bad Request');
          done();
        })
        .catch(done);
    });

    it('should return verificationSuccess', (done) => {
      request(app)
        .get(`/api/auth/verify/${verification}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.verificationSuccess);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/auth/random-number', () => {
    it('should fail to get random number because of missing Authorization', (done) => {
      request(app)
        .get('/api/auth/random-number')
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });

    it('should fail to get random number because of wrong token', (done) => {
      request(app)
        .get('/api/auth/random-number')
        .set('Authorization', 'Bearer inValidToken')
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });

    it('should get a random number', (done) => {
      request(app)
        .get('/api/auth/random-number')
        .set('Authorization', jwtToken)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.num).to.be.a('number');
          done();
        })
        .catch(done);
    });
  });
});
