const Joi = require('joi');

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

// define validation for all the env vars
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .allow(['development', 'production', 'test', 'provision'])
    .default('development'),
  PORT: Joi.number()
    .default(4040),
  MONGOOSE_DEBUG: Joi.boolean()
    .when('NODE_ENV', {
      is: Joi.string().equal('development'),
      then: Joi.boolean().default(true),
      otherwise: Joi.boolean().default(false)
    }),
  JWT_SECRET: Joi.string().required()
    .description('JWT Secret required to sign'),
  ADMIN_CODE: Joi.string().required()
    .description('Code used to create an administrator user.'),
  MONGO_HOST: Joi.string().required()
    .description('Mongo DB host url'),
  MONGO_PORT: Joi.number()
    .default(27017),
  SMTP_HOST: Joi.string().required()
    .description('SMTP Hostname'),
  SMTP_PORT: Joi.number()
    .default(587),
  SMTP_USER: Joi.string().required()
    .description('SMTP Username'),
  SMTP_PASS: Joi.string().required()
    .description('SMTP Password'),
  MX_CONSUMER_KEY: Joi.string().required()
    .description('MX Payments API Consumer Key'),
  MX_CONSUMER_SECRET: Joi.string().required()
    .description('MX Payments API Consumer Secret'),
  MX_MERCHANT_ID: Joi.number()
    .description('MX Payments API Merchant ID'),
  FIREBASE_WEBAPIKEY: Joi.string().required()
    .description('Firebase Web API Key')

}).unknown()
  .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongooseDebug: envVars.MONGOOSE_DEBUG,
  jwtSecret: envVars.JWT_SECRET,
  adminCode: envVars.ADMIN_CODE,
  mongo: {
    host: envVars.MONGO_HOST,
    port: envVars.MONGO_PORT
  },
  smtp: {
    host: envVars.SMTP_HOST,
    port: envVars.SMTP_PORT,
    user: envVars.SMTP_USER,
    pass: envVars.SMTP_PASS
  },
  mx: {
    consumerKey: envVars.MX_CONSUMER_KEY,
    consumerSecret: envVars.MX_CONSUMER_SECRET,
    merchantId: envVars.MX_MERCHANT_ID
  },
  firebaseWebApiKey: envVars.FIREBASE_WEBAPIKEY
};

module.exports = config;
