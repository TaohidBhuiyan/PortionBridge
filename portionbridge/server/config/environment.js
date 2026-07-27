require('dotenv').config();

/**
 * Validates the configuration required for the server to safely start.
 * Development retains the existing local database defaults; production must
 * explicitly configure every security- and connection-critical value.
 */
function validateEnvironment() {
  const environment = process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';
  const errors = [];
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || accessSecret.length < 32 || accessSecret.includes('replace_with')) {
    errors.push('JWT_ACCESS_SECRET must be set to a non-placeholder value of at least 32 characters.');
  }

  if (!refreshSecret || refreshSecret.length < 32 || refreshSecret.includes('replace_with')) {
    errors.push('JWT_REFRESH_SECRET must be set to a non-placeholder value of at least 32 characters.');
  }

  if (!process.env.JWT_ACCESS_EXPIRES_IN) {
    errors.push('JWT_ACCESS_EXPIRES_IN is required.');
  }

  if (isProduction) {
    ['CLIENT_URL', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'].forEach((name) => {
      if (!process.env[name]) {
        errors.push(`${name} is required in production.`);
      }
    });

    if (process.env.CLIENT_URL && !process.env.CLIENT_URL.startsWith('https://')) {
      errors.push('CLIENT_URL must use https:// in production.');
    }

    // Email configuration is required in production
    ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASSWORD'].forEach((name) => {
      if (!process.env[name]) {
        errors.push(`${name} is required in production for email delivery.`);
      }
    });

    if (process.env.EMAIL_PORT && (!Number.isInteger(Number(process.env.EMAIL_PORT)) || Number(process.env.EMAIL_PORT) < 1 || Number(process.env.EMAIL_PORT) > 65535)) {
      errors.push('EMAIL_PORT must be a valid port number (1-65535).');
    }
  }

  if (process.env.DB_PORT && (!Number.isInteger(Number(process.env.DB_PORT)) || Number(process.env.DB_PORT) < 1)) {
    errors.push('DB_PORT must be a valid positive integer.');
  }

  if (process.env.PORT && (!Number.isInteger(Number(process.env.PORT)) || Number(process.env.PORT) < 1)) {
    errors.push('PORT must be a valid positive integer.');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid server configuration:\n- ${errors.join('\n- ')}`);
  }
}

module.exports = { validateEnvironment };
