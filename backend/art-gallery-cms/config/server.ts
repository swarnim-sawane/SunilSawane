export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', ''),
  proxy: {
    koa: env.bool('TRUST_PROXY', env('NODE_ENV') === 'production'),
  },
  app: {
    keys: env.array('APP_KEYS'),
  },
  transfer: {
    remote: {
      enabled: env.bool('REMOTE_DATA_TRANSFER_ENABLED', false),
    },
  },
});
