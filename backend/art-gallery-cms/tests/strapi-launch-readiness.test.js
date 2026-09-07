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
  assert.equal(attributes.isFeatured.default, false);

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
  };

  const issues = getProductionReadinessIssues(unsafeEnv);
  assert.ok(issues.some((issue) => /DATABASE_CLIENT=postgres/.test(issue)));
  assert.ok(issues.some((issue) => /PUBLIC_URL/.test(issue)));
  assert.ok(issues.some((issue) => /Razorpay live key id/.test(issue)));
  assert.ok(issues.some((issue) => /RAZORPAY_KEY_SECRET/.test(issue)));
  assert.throws(() => assertProductionReady(unsafeEnv), /Production readiness check failed/);

  assert.deepEqual(
    getProductionReadinessIssues({
      NODE_ENV: 'production',
      PUBLIC_URL: 'https://cms.sunilsawane.example',
      DATABASE_CLIENT: 'postgres',
      DATABASE_URL: 'postgres://user:pass@db.example:5432/sunilsawane',
      RAZORPAY_KEY_ID: 'rzp_live_1234567890',
      RAZORPAY_KEY_SECRET: 'live_secret_value',
      APP_KEYS: 'prod-key-one,prod-key-two',
      API_TOKEN_SALT: 'prod-api-token-salt',
      ADMIN_JWT_SECRET: 'prod-admin-jwt-secret',
      TRANSFER_TOKEN_SALT: 'prod-transfer-token-salt',
      JWT_SECRET: 'prod-jwt-secret',
      ENCRYPTION_KEY: 'prod-encryption-key',
      ORDER_NOTIFICATION_EMAIL: 'sunilsawaneart@gmail.com',
      ORDER_EMAIL_FROM: 'orders@sunilsawane.example',
    }),
    []
  );
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
      { title: 'Floral Exchange', quantity: 1, price: 5000 },
    ],
    totalAmount: 5000,
  }, {
    ORDER_NOTIFICATION_EMAIL: 'sunilsawaneart@gmail.com',
    ORDER_EMAIL_FROM: 'orders@sunilsawane.example',
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
