import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // DB
  DATABASE_URL: Joi.string().required(),

  // APP
  APP_FULL_NAME: Joi.string().required(),
  APP_NAME: Joi.string().required(),
  APP_PORT: Joi.number().required(),

  LOG_LEVEL: Joi.string().required(),

  BCRYPT_SALT: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  // CORS
  CORS_ORIGIN: Joi.string().required(),
  CORS_METHODS: Joi.string().required(),
  CORS_ALLOWED_HEADERS: Joi.string().required(),
});
