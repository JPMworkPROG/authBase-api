import * as Joi from 'joi';

export interface Configuration {
  port: number;
  domainUrl: string;
  database: {
    url: string;
  };
  jwt: {
    accessSecret: string;
    accessExpires: string;
    refreshSecret: string;
    refreshExpires: string;
  };
  auth: {
    saltRounds: number;
    passwordResetExpires: string;
  };
  app: {
    environment: string;
  };
}

export const configurationValidationSchema = Joi.object({
  PORT: Joi.number().port().required(),
  DOMAIN_URL: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES: Joi.string().default('7d'),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(4).default(10),
  AUTH_PASSWORD_RESET_EXPIRES: Joi.string().default('1h'),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
});

/**
 * Carrega a configuração a partir das variáveis de ambiente.
 */
export default (): Configuration => ({
  port: parseInt(process.env.PORT ?? '8080', 10),
  domainUrl: process.env.DOMAIN_URL ?? 'localhost',
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
  },
  auth: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10),
    passwordResetExpires: process.env.AUTH_PASSWORD_RESET_EXPIRES ?? '1h',
  },
  app: {
    environment: process.env.NODE_ENV ?? 'development',
  },
});
