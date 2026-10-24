import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .required(),
    PORT: Joi.number().default(3000),

    POSTGRES_HOST: Joi.string().required(),
    POSTGRES_PORT: Joi.number().required(),
    POSTGRES_USER: Joi.string().required(),
    POSTGRES_PASSWORD: Joi.string().required(),
    POSTGRES_DB: Joi.string().required(),

    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().required(),
    JWT_REFRESH_SECRET: Joi.string().required(),
    JWT_REFRESH_EXPIRES_IN: Joi.string().required(),

    GOOGLE_CLIENT_ID: Joi.string().required(),
    GOOGLE_CLIENT_SECRET: Joi.string().required(),
    GOOGLE_CALLBACK_URL: Joi.string().required(),

    MAIL_USER: Joi.string().required(),
    MAIL_PASSWORD: Joi.string().required(),

    FRONTEND_URL: Joi.string().required(),

    PAYMENT_PROVIDER: Joi.string().valid('paymob').required(),

    PAYMOB_SECRET_KEY: Joi.string().when('PAYMENT_PROVIDER', {
        is: 'paymob',
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
    PAYMOB_PUBLIC_KEY: Joi.string().when('PAYMENT_PROVIDER', {
        is: 'paymob',
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
    PAYMOB_HMAC_SECRET: Joi.string().when('PAYMENT_PROVIDER', {
        is: 'paymob',
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
    PAYMOB_INTEGRATION_ID: Joi.number().when('PAYMENT_PROVIDER', {
        is: 'paymob',
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
    PAYMOB_BASE_URL: Joi.string().uri().when('PAYMENT_PROVIDER', {
        is: 'paymob',
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
    API_PUBLIC_URL: Joi.string().uri().when('PAYMENT_PROVIDER', {
        is: 'paymob',
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
});
