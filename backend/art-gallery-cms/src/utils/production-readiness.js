'use strict';

const REQUIRED_SECRET_KEYS = [
  'APP_KEYS',
  'API_TOKEN_SALT',
  'ADMIN_JWT_SECRET',
  'TRANSFER_TOKEN_SALT',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
];

const PLACEHOLDER_RE = /(toBeModified|tobemodified|replace_me|your-|example|localhost|127\.0\.0\.1)/i;

function clean(value) {
  return String(value || '').trim();
}

function isProduction(env = process.env) {
  return clean(env.NODE_ENV) === 'production';
}

function isHttpsUrl(value) {
  try {
    const url = new URL(clean(value));
    return url.protocol === 'https:' && !/localhost|127\.0\.0\.1/i.test(url.hostname);
  } catch (error) {
    return false;
  }
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(value));
}

function hasProductionSecret(value) {
  const normalized = clean(value);
  return normalized.length >= 8 && !PLACEHOLDER_RE.test(normalized);
}

function getProductionReadinessIssues(env = process.env) {
  if (!isProduction(env)) {
    return [];
  }

  const issues = [];

  if (clean(env.DATABASE_CLIENT) !== 'postgres') {
    issues.push('Production must use DATABASE_CLIENT=postgres.');
  }

  if (!clean(env.DATABASE_URL) && !(clean(env.DATABASE_HOST) && clean(env.DATABASE_NAME) && clean(env.DATABASE_USERNAME))) {
    issues.push('Production database configuration must provide DATABASE_URL or host/name/user fields.');
  }

  if (!isHttpsUrl(env.PUBLIC_URL)) {
    issues.push('Production PUBLIC_URL must be a deployed HTTPS Strapi URL, not localhost.');
  }

  if (!/^rzp_live_[A-Za-z0-9]+$/.test(clean(env.RAZORPAY_KEY_ID))) {
    issues.push('Production must use a Razorpay live key id in RAZORPAY_KEY_ID.');
  }

  if (!hasProductionSecret(env.RAZORPAY_KEY_SECRET)) {
    issues.push('Production RAZORPAY_KEY_SECRET must be set in backend env and cannot be a placeholder.');
  }

  for (const key of REQUIRED_SECRET_KEYS) {
    if (!hasProductionSecret(env[key])) {
      issues.push(`Production ${key} must be set to a non-placeholder secret.`);
    }
  }

  if (!isEmail(env.ORDER_NOTIFICATION_EMAIL)) {
    issues.push('Production ORDER_NOTIFICATION_EMAIL must be set to the artist/order inbox.');
  }

  if (!isEmail(env.ORDER_EMAIL_FROM)) {
    issues.push('Production ORDER_EMAIL_FROM must be set to a verified sender address.');
  }

  return issues;
}

function assertProductionReady(env = process.env) {
  const issues = getProductionReadinessIssues(env);

  if (issues.length > 0) {
    throw new Error(`Production readiness check failed:\n- ${issues.join('\n- ')}`);
  }
}

module.exports = {
  assertProductionReady,
  getProductionReadinessIssues,
  isProduction,
};
