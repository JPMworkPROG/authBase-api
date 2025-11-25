import * as dotenv from 'dotenv';
import * as env from 'env-var';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

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

/**
 * Carrega e valida todas as variáveis de ambiente obrigatórias
 * Se alguma variável estiver ausente ou inválida, a aplicação não iniciará
 */
export default (): Configuration => {
  try {
    const config: Configuration = {
      port: env.get('PORT')
        .required()
        .asPortNumber(),
      domainUrl: env.get('DOMAIN_URL')
        .required()
        .asString(),
      database: {
        url: env
          .get('DATABASE_URL')
          .required()
          .asString(),
      },

      jwt: {
        accessSecret: env
          .get('JWT_ACCESS_SECRET')
          .required()
          .asString(),
        accessExpires: env
          .get('JWT_ACCESS_EXPIRES')
          .default('15m')
          .asString(),
        refreshSecret: env
          .get('JWT_REFRESH_SECRET')
          .required()
          .asString(),
        refreshExpires: env
          .get('JWT_REFRESH_EXPIRES')
          .default('7d')
          .asString(),
      },

      auth: {
        saltRounds: env
          .get('BCRYPT_SALT_ROUNDS')
          .default(10)
          .asIntPositive(),
        passwordResetExpires: env
          .get('AUTH_PASSWORD_RESET_EXPIRES')
          .default('1h')
          .asString(),
      },

      app: {
        environment: env
          .get('NODE_ENV')
          .default('development')
          .asEnum(['development', 'production', 'test']),
      },
    };

    console.log('Environment variables loaded and validated successfully');
    return config;

  } catch (error) {
    console.error('Failed to load environment variables:');
    console.error(error.message);

    process.exit(1);
  }
};