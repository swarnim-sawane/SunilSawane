const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..', '..');
const readBackend = (file) => fs.readFileSync(path.join(backendRoot, file), 'utf8');
const readJson = (file) => JSON.parse(readBackend(file));
const readJsonWithComments = (file) => JSON.parse(readBackend(file).replace(/^\s*\/\/.*$/gm, ''));

test('artwork schema captures final collector data before sale', () => {
  const schema = readJson('src/api/artwork/content-types/artwork/schema.json');
  const attributes = schema.attributes;

  assert.equal(attributes.dimensions.type, 'string');
  assert.equal(attributes.medium.type, 'string');
  assert.equal(attributes.yearCreated.type, 'integer');
  assert.equal(attributes.price.type, 'decimal');
  assert.equal(attributes.isAvailable.type, 'boolean');
  assert.equal(attributes.isAvailable.default, true);
  assert.equal(attributes.availabilityStatus.type, 'enumeration');
  assert.deepEqual(attributes.availabilityStatus.enum, [
    'available',
    'reserved',
    'sold',
    'not_for_sale',
  ]);
  assert.equal(attributes.availabilityStatus.default, 'available');
  assert.equal(attributes.availabilityStatus.required, true);
  assert.equal(attributes.isFeatured.default, false);
  assert.equal(attributes.seriesName.type, 'string');
  assert.equal(attributes.seriesName.required, false);

  assert.equal(attributes.framingStatus.type, 'enumeration');
  assert.deepEqual(attributes.framingStatus.enum, [
    'unframed',
    'framed',
    'framing_available',
    'to_be_confirmed',
  ]);
  assert.equal(attributes.framingStatus.default, 'to_be_confirmed');
  assert.equal(attributes.shippingNote.type, 'text');
  assert.equal(attributes.certificateNote.type, 'text');
});

test('production guard rejects unsafe live configuration and allows complete launch env', () => {
  const {
    assertProductionReady,
    getProductionReadinessIssues,
  } = require('../src/utils/production-readiness');

  const unsafeEnv = {
    NODE_ENV: 'production',
    PUBLIC_URL: 'http://localhost:1337',
    DATABASE_CLIENT: 'sqlite',
    RAZORPAY_KEY_ID: 'rzp_test_replace_me',
    RAZORPAY_KEY_SECRET: 'replace_me',
    APP_KEYS: 'toBeModified1,toBeModified2',
    API_TOKEN_SALT: 'tobemodified',
    ADMIN_JWT_SECRET: 'tobemodified',
    TRANSFER_TOKEN_SALT: 'tobemodified',
    JWT_SECRET: 'tobemodified',
    ENCRYPTION_KEY: 'tobemodified',
    CLOUDINARY_ENABLED: 'false',
  };

  const issues = getProductionReadinessIssues(unsafeEnv);
  assert.ok(issues.some((issue) => /DATABASE_CLIENT=postgres/.test(issue)));
  assert.ok(issues.some((issue) => /PUBLIC_URL/.test(issue)));
  assert.ok(issues.some((issue) => /Razorpay live key id/.test(issue)));
  assert.ok(issues.some((issue) => /RAZORPAY_KEY_SECRET/.test(issue)));
  assert.ok(issues.some((issue) => /CLOUDINARY_ENABLED=true/.test(issue)));
  assert.ok(issues.some((issue) => /CLOUDINARY_NAME/.test(issue)));
  assert.ok(issues.some((issue) => /CLOUDINARY_KEY/.test(issue)));
  assert.ok(issues.some((issue) => /CLOUDINARY_SECRET/.test(issue)));
  assert.throws(() => assertProductionReady(unsafeEnv), /Production readiness check failed/);

  assert.deepEqual(
    getProductionReadinessIssues({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://sunilsawane.example',
      PUBLIC_URL: 'https://cms.sunilsawane.example',
      DATABASE_CLIENT: 'postgres',
      DATABASE_URL: 'postgres://user:pass@db.example:5432/sunilsawane',
      RAZORPAY_KEY_ID: 'rzp_live_1234567890',
      RAZORPAY_KEY_SECRET: 'live_secret_value',
      RAZORPAY_WEBHOOK_SECRET: 'live_webhook_secret_value',
      APP_KEYS: 'prod-key-one,prod-key-two',
      API_TOKEN_SALT: 'prod-api-token-salt',
      ADMIN_JWT_SECRET: 'prod-admin-jwt-secret',
      TRANSFER_TOKEN_SALT: 'prod-transfer-token-salt',
      JWT_SECRET: 'prod-jwt-secret',
      ENCRYPTION_KEY: 'prod-encryption-key',
      CLOUDINARY_ENABLED: 'true',
      CLOUDINARY_NAME: 'sunilsawane-cloud',
      CLOUDINARY_KEY: '123456789012345',
      CLOUDINARY_SECRET: 'prod-cloudinary-secret',
      ORDER_NOTIFICATION_EMAIL: 'sunilsawaneart@gmail.com',
      ORDER_EMAIL_FROM: 'orders@sunilsawane.example',
      SMTP_HOST: 'smtp.sunilsawane.example',
      SMTP_USERNAME: 'orders-user',
      SMTP_PASSWORD: 'smtp-secret-value',
    }),
    []
  );

  const stagingIssues = getProductionReadinessIssues({
    NODE_ENV: 'production',
    DEPLOYMENT_STAGE: 'staging',
    FRONTEND_URL: 'https://sunilsawane.example',
    PUBLIC_URL: 'https://gallery-cms.example',
    DATABASE_CLIENT: 'postgres',
    DATABASE_URL: 'postgres://user:pass@db.example:5432/sunilsawane',
    RAZORPAY_KEY_ID: 'rzp_test_1234567890',
    RAZORPAY_KEY_SECRET: 'test_secret_value',
    RAZORPAY_WEBHOOK_SECRET: 'test_webhook_secret_value',
    APP_KEYS: 'staging-key-one,staging-key-two',
    API_TOKEN_SALT: 'staging-api-token-salt',
    ADMIN_JWT_SECRET: 'staging-admin-jwt-secret',
    TRANSFER_TOKEN_SALT: 'staging-transfer-token-salt',
    JWT_SECRET: 'staging-jwt-secret',
    ENCRYPTION_KEY: 'staging-encryption-key',
    CLOUDINARY_ENABLED: 'true',
    CLOUDINARY_NAME: 'sunilsawane-cloud',
    CLOUDINARY_KEY: '123456789012345',
    CLOUDINARY_SECRET: 'staging-cloudinary-secret',
    ORDER_NOTIFICATION_EMAIL: 'sunilsawaneart@gmail.com',
    ORDER_EMAIL_FROM: 'orders@sunilsawane.example',
  });
  assert.deepEqual(stagingIssues, []);

  const stagingWithLivePayments = getProductionReadinessIssues({
    NODE_ENV: 'production',
    DEPLOYMENT_STAGE: 'staging',
    RAZORPAY_KEY_ID: 'rzp_live_1234567890',
  });
  assert.ok(stagingWithLivePayments.some((issue) => /Razorpay test key id/.test(issue)));

  const reusedPaymentSecretIssues = getProductionReadinessIssues({
    NODE_ENV: 'production',
    DEPLOYMENT_STAGE: 'live',
    FRONTEND_URL: 'https://sunilsawane.example',
    PUBLIC_URL: 'https://cms.sunilsawane.example',
    DATABASE_CLIENT: 'postgres',
    DATABASE_URL: 'postgres://user:pass@db.example:5432/sunilsawane',
    RAZORPAY_KEY_ID: 'rzp_live_1234567890',
    RAZORPAY_KEY_SECRET: 'same-production-secret',
    RAZORPAY_WEBHOOK_SECRET: 'same-production-secret',
    APP_KEYS: 'prod-key-one,prod-key-two',
    API_TOKEN_SALT: 'prod-api-token-salt',
    ADMIN_JWT_SECRET: 'prod-admin-jwt-secret',
    TRANSFER_TOKEN_SALT: 'prod-transfer-token-salt',
    JWT_SECRET: 'prod-jwt-secret',
    ENCRYPTION_KEY: 'prod-encryption-key',
    CLOUDINARY_ENABLED: 'true',
    CLOUDINARY_NAME: 'sunilsawane-cloud',
    CLOUDINARY_KEY: '123456789012345',
    CLOUDINARY_SECRET: 'prod-cloudinary-secret',
    ORDER_NOTIFICATION_EMAIL: 'sunilsawaneart@gmail.com',
    ORDER_EMAIL_FROM: 'orders@sunilsawane.example',
    SMTP_HOST: 'smtp.sunilsawane.example',
    SMTP_USERNAME: 'orders-user',
    SMTP_PASSWORD: 'smtp-secret-value',
  });
  assert.ok(reusedPaymentSecretIssues.some((issue) => /must be different/i.test(issue)));
});

test('order confirmation email utility prepares artist and collector messages', () => {
  const {
    buildOrderEmailMessages,
  } = require('../src/api/order/utils/order-email');

  const messages = buildOrderEmailMessages({
    orderNumber: 'ORD-1234567890',
    customerName: 'Collector Name',
    customerEmail: 'collector@example.com',
    customerPhone: '+919999999999',
    shippingAddress: 'Gurgaon, Haryana',
    orderItems: [
      {
        title: 'Floral Exchange <script>alert("x")</script>',
        quantity: 1,
        price: 5000,
        medium: 'Pen & ink',
        dimensions: '18 x 24 in',
      },
    ],
    totalAmount: 5000,
  }, {
    ORDER_NOTIFICATION_EMAIL: 'sunilsawaneart@gmail.com',
    ORDER_EMAIL_FROM: 'orders@sunilsawane.example',
    FRONTEND_URL: 'https://sunilsawane.vercel.app',
    PUBLIC_URL: 'https://cms.sunilsawane.example',
  });

  assert.equal(messages.length, 2);
  assert.equal(messages[0].to, 'sunilsawaneart@gmail.com');
  assert.equal(messages[1].to, 'collector@example.com');
  assert.match(messages[0].subject, /New paid artwork order/);
  assert.match(messages[1].subject, /Order confirmed/);
  assert.match(messages[0].text, /Floral Exchange/);
  assert.match(messages[1].text, /certificate/i);
  assert.doesNotMatch(messages[1].text, /paymentSignature/i);
  assert.match(messages[0].html, /NEW PAID ORDER/);
  assert.match(messages[1].html, /YOUR ACQUISITION IS CONFIRMED/);
  assert.match(messages[1].html, /#787d62/i);
  assert.match(messages[1].html, /#94372b/i);
  assert.match(messages[1].html, /VIEW ORDER RECEIPT/);
  assert.match(messages[1].html, /https:\/\/sunilsawane\.vercel\.app\/order-success\.html\?order=ORD-1234567890/);
  assert.match(messages[1].text, /https:\/\/sunilsawane\.vercel\.app\/order-success\.html\?order=ORD-1234567890/);
  assert.doesNotMatch(messages[1].html, /cms\.sunilsawane\.example\/api\/orders\/receipt/);
  assert.match(messages[1].html, /18 x 24 in/);
  assert.match(messages[1].html, /Floral Exchange &lt;script&gt;/);
  assert.doesNotMatch(messages[1].html, /<script>/i);
});

test('order confirmation retries only recipients that have not already received email', async () => {
  const { notifyOrderConfirmed } = require('../src/api/order/utils/order-email');
  const sent = [];
  const strapi = {
    plugin() {
      return {
        service() {
          return {
            async send(message) {
              sent.push(message.to);
              if (message.to === 'collector@example.com' && sent.length === 2) {
                throw new Error('temporary delivery failure');
              }
            },
          };
        },
      };
    },
  };
  const env = {
    ORDER_NOTIFICATION_EMAIL: 'artist@example.com',
    ORDER_EMAIL_FROM: 'orders@example.com',
  };
  const order = {
    orderNumber: 'ORD-1234567890',
    customerName: 'Collector',
    customerEmail: 'collector@example.com',
    orderItems: [{ title: 'Artwork', quantity: 1, price: 5000 }],
    totalAmount: 5000,
  };

  const first = await notifyOrderConfirmed(strapi, order, env);
  assert.equal(first.status, 'partial');
  assert.equal(first.delivery.artist.status, 'sent');
  assert.equal(first.delivery.collector.status, 'failed');

  const second = await notifyOrderConfirmed(strapi, { ...order, emailDelivery: first.delivery }, env);
  assert.equal(second.status, 'sent');
  assert.deepEqual(sent, ['artist@example.com', 'collector@example.com', 'collector@example.com']);
});

test('launch scripts and docs expose content and production checks', () => {
  const packageJson = readJson('package.json');
  const readinessDoc = fs.readFileSync(path.join(repoRoot, 'docs', 'production-readiness.md'), 'utf8');

  assert.equal(packageJson.scripts['content:audit'], 'node scripts/audit-artwork-readiness.js');
  assert.equal(packageJson.scripts['production:check'], 'node scripts/check-production-readiness.js');
  assert.ok(fs.existsSync(path.join(backendRoot, 'scripts', 'audit-artwork-readiness.js')));
  assert.ok(fs.existsSync(path.join(backendRoot, 'scripts', 'check-production-readiness.js')));

  const auditScript = readBackend('scripts/audit-artwork-readiness.js');
  assert.match(auditScript, /framingStatus/);
  assert.match(auditScript, /shippingNote/);
  assert.match(auditScript, /certificateNote/);
  assert.match(auditScript, /STRAPI_API_TOKEN/);

  assert.match(readinessDoc, /npm run content:audit/);
  assert.match(readinessDoc, /npm run production:check/);
  assert.match(readinessDoc, /ORDER_NOTIFICATION_EMAIL/);
});

test('strapi build includes JavaScript helpers required by compiled controllers', () => {
  const tsconfig = readJsonWithComments('tsconfig.json');
  const indexSource = readBackend('src/index.ts');
  const orderController = readBackend('src/api/order/controllers/order.ts');

  assert.equal(tsconfig.compilerOptions.allowJs, true);
  assert.match(indexSource, /require\('\.\/utils\/production-readiness'\)/);
  assert.ok(fs.existsSync(path.join(backendRoot, 'src', 'utils', 'production-readiness.js')));
  assert.match(orderController, /require\('\.\.\/utils\/order-email'\)/);
  assert.ok(fs.existsSync(path.join(backendRoot, 'src', 'api', 'order', 'utils', 'order-email.js')));
});

test('artwork price migration updates every record once and preserves rollback values', async () => {
  const {
    MIGRATION_KEY,
    TARGET_PRICE,
    migrateArtworkPrices,
  } = require('../src/utils/artwork-price-migration');
  const records = [
    { id: 1, documentId: 'artwork-one', price: 5000 },
    { id: 2, documentId: 'artwork-two', price: '6500' },
  ];
  let migrationState = null;
  let updateCalls = 0;
  const strapi = {
    store(options) {
      assert.equal(options.key, MIGRATION_KEY);
      return {
        async get() {
          return migrationState;
        },
        async set({ value }) {
          migrationState = value;
        },
      };
    },
    db: {
      query(uid) {
        assert.equal(uid, 'api::artwork.artwork');
        return {
          async findMany() {
            return records.map((record) => ({ ...record }));
          },
          async updateMany({ data }) {
            updateCalls += 1;
            records.forEach((record) => {
              record.price = data.price;
            });
            return { count: records.length };
          },
        };
      },
    },
    log: { info() {} },
  };

  const first = await migrateArtworkPrices(strapi);
  assert.equal(first.status, 'completed');
  assert.equal(first.updatedCount, 2);
  assert.deepEqual(records.map((record) => record.price), [TARGET_PRICE, TARGET_PRICE]);
  assert.deepEqual(first.previousPrices, [
    { id: 1, documentId: 'artwork-one', price: 5000 },
    { id: 2, documentId: 'artwork-two', price: '6500' },
  ]);

  const second = await migrateArtworkPrices(strapi);
  assert.equal(second.skipped, true);
  assert.equal(updateCalls, 1);
});

test('artwork tier migration prices featured works at 9999 and all others at 7999 once', async () => {
  const {
    FEATURED_PRICE,
    STANDARD_PRICE,
    TIER_MIGRATION_KEY,
    migrateArtworkTierPrices,
  } = require('../src/utils/artwork-price-migration');
  assert.equal(FEATURED_PRICE, 9999);
  assert.equal(TIER_MIGRATION_KEY, 'artwork-featured-price-9999-v2');
  const records = [
    { id: 1, documentId: 'featured-one', price: 7999, isFeatured: true },
    { id: 2, documentId: 'standard-one', price: 5000, isFeatured: false },
    { id: 3, documentId: 'standard-two', price: 6500, isFeatured: null },
  ];
  let migrationState = null;
  let updateCalls = 0;
  const strapi = {
    store(options) {
      assert.equal(options.key, TIER_MIGRATION_KEY);
      return {
        async get() { return migrationState; },
        async set({ value }) { migrationState = value; },
      };
    },
    db: {
      query(uid) {
        assert.equal(uid, 'api::artwork.artwork');
        return {
          async findMany() { return records.map((record) => ({ ...record })); },
          async update({ where, data }) {
            updateCalls += 1;
            const record = records.find((item) => item.id === where.id);
            record.price = data.price;
            return { ...record };
          },
        };
      },
    },
    log: { info() {} },
  };

  const first = await migrateArtworkTierPrices(strapi);
  assert.equal(first.status, 'completed');
  assert.equal(first.updatedCount, 3);
  assert.deepEqual(records.map((record) => record.price), [FEATURED_PRICE, STANDARD_PRICE, STANDARD_PRICE]);
  assert.deepEqual(first.previousPrices, [
    { id: 1, documentId: 'featured-one', price: 7999, isFeatured: true },
    { id: 2, documentId: 'standard-one', price: 5000, isFeatured: false },
    { id: 3, documentId: 'standard-two', price: 6500, isFeatured: null },
  ]);

  const second = await migrateArtworkTierPrices(strapi);
  assert.equal(second.skipped, true);
  assert.equal(updateCalls, 3);
});

test('artwork lifecycle keeps prices aligned when the featured flag changes', () => {
  const lifecycle = require('../src/api/artwork/content-types/artwork/lifecycles');

  const featuredCreate = { params: { data: { title: 'Featured', isFeatured: true, price: 7999 } } };
  lifecycle.beforeCreate(featuredCreate);
  assert.equal(featuredCreate.params.data.price, 9999);

  const standardCreate = { params: { data: { title: 'Standard' } } };
  lifecycle.beforeCreate(standardCreate);
  assert.equal(standardCreate.params.data.price, 7999);

  const featureToggle = { params: { data: { isFeatured: true } } };
  lifecycle.beforeUpdate(featureToggle);
  assert.equal(featureToggle.params.data.price, 9999);

  const unrelatedUpdate = { params: { data: { title: 'Renamed' } } };
  lifecycle.beforeUpdate(unrelatedUpdate);
  assert.equal(Object.hasOwn(unrelatedUpdate.params.data, 'price'), false);
});
