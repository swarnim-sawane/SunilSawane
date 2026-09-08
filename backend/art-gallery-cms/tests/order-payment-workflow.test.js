const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const backendRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(backendRoot, file), 'utf8');
const readJson = (file) => JSON.parse(read(file));

test('order model persists reservation, gateway verification, and email delivery state', () => {
  const attributes = readJson('src/api/order/content-types/order/schema.json').attributes;

  assert.ok(attributes.orderStatus.enum.includes('expired'));
  assert.ok(attributes.orderStatus.enum.includes('failed'));
  assert.ok(attributes.orderStatus.enum.includes('payment_review'));
  assert.ok(attributes.orderStatus.enum.includes('refunded'));
  assert.equal(attributes.expectedAmountPaise.type, 'integer');
  assert.equal(attributes.paymentCurrency.default, 'INR');
  assert.equal(attributes.reservationExpiresAt.type, 'datetime');
  assert.equal(attributes.reservationTokenHash.private, true);
  assert.equal(attributes.paymentVerifiedAt.type, 'datetime');
  assert.equal(attributes.emailStatus.type, 'enumeration');
  assert.equal(attributes.emailDelivery.type, 'json');
});

test('payment routes expose signed webhook and reservation release handlers', () => {
  const routes = read('src/api/order/routes/custom-order.ts');
  const middleware = read('config/middlewares.ts');

  assert.match(routes, /path:\s*'\/orders\/razorpay-webhook'/);
  assert.match(routes, /handler:\s*'order\.razorpayWebhook'/);
  assert.match(routes, /path:\s*'\/orders\/release-reservation'/);
  assert.match(routes, /handler:\s*'order\.releaseReservation'/);
  assert.match(routes, /global::payment-rate-limit/);
  assert.match(middleware, /includeUnparsed:\s*true/);
});

test('controller reserves stock before opening Razorpay and verifies gateway payment data', () => {
  const controller = read('src/api/order/controllers/order.ts');
  const index = read('src/index.ts');

  assert.match(controller, /reserveArtworks/);
  assert.match(controller, /releaseReservedArtworks/);
  assert.match(controller, /fetchRazorpayPayment/);
  assert.match(controller, /validateCapturedPayment/);
  assert.match(controller, /verifyRazorpayWebhookSignature/);
  assert.match(controller, /x-razorpay-event-id/i);
  assert.match(controller, /expectedAmountPaise/);
  assert.match(controller, /reservationExpiresAt/);
  assert.match(controller, /payment_capture:\s*1/);
  assert.match(controller, /retryPendingOrderEmails/);
  assert.match(controller, /runPaymentMaintenance/);
  assert.match(controller, /reservationOwnerHash/);
  assert.match(controller, /enforceReservationQuota/);
  assert.match(controller, /getRazorpayPaymentState/);
  assert.match(controller, /where:\s*\{\s*id:\s*current\.id,\s*orderStatus:\s*current\.orderStatus\s*\}/);
  assert.match(index, /setInterval/);
  assert.match(index, /runPaymentMaintenance/);
});

test('confirmed payment state is synchronized to the published order document', () => {
  const controller = read('src/api/order/controllers/order.ts');
  const finalizer = controller.slice(
    controller.indexOf('async function finalizeCapturedPayment'),
    controller.indexOf('async function failAndReleaseReservation')
  );

  assert.match(controller, /async function publishOrderDocument\(strapi, order\)/);
  assert.match(controller, /\.publish\(\{\s*documentId:\s*order\.documentId\s*\}\)/);
  assert.match(finalizer, /await publishOrderDocument\(strapi, current\)/);
  assert.match(finalizer, /await publishOrderDocument\(strapi, finalized\)/);
});

test('webhook event model uses a unique gateway event id for durable idempotency', () => {
  const schema = readJson('src/api/payment-event/content-types/payment-event/schema.json');

  assert.equal(schema.options.draftAndPublish, false);
  assert.equal(schema.attributes.eventId.unique, true);
  assert.equal(schema.attributes.eventId.required, true);
  assert.ok(schema.attributes.processingStatus.enum.includes('processed'));
  assert.ok(schema.attributes.processingStatus.enum.includes('failed'));
});

test('production readiness requires webhook and SMTP secrets', () => {
  const readiness = read('src/utils/production-readiness.js');
  const orderEmail = read('src/api/order/utils/order-email.js');
  const envExample = read('.env.example');
  const packageJson = readJson('package.json');
  const packageLock = readJson('package-lock.json');

  assert.match(readiness, /RAZORPAY_WEBHOOK_SECRET/);
  assert.match(readiness, /SMTP_HOST/);
  assert.match(orderEmail, /require\('nodemailer'\)/);
  assert.equal(packageJson.dependencies.nodemailer, '9.0.6');
  assert.equal(packageJson.overrides.nodemailer, '9.0.6');
  assert.equal(packageLock.packages[''].dependencies.nodemailer, '9.0.6');
  assert.equal(packageLock.packages['node_modules/nodemailer'].version, '9.0.6');
  assert.match(orderEmail, /requireTLS:\s*!smtpSecure/);
  assert.match(orderEmail, /rejectUnauthorized:\s*true/);
  assert.match(orderEmail, /disableFileAccess:\s*true/);
  assert.match(orderEmail, /disableUrlAccess:\s*true/);
  assert.match(envExample, /RAZORPAY_WEBHOOK_SECRET=/);
  assert.match(envExample, /SMTP_HOST=/);
});

test('payment rate limiting uses stable bounded buckets', () => {
  const policy = read('src/policies/payment-rate-limit.ts');
  const routes = read('src/api/order/routes/custom-order.ts');
  const server = read('config/server.ts');

  assert.match(policy, /config\.bucket/);
  assert.match(policy, /MAX_BUCKETS/);
  assert.match(routes, /bucket:\s*'receipt'/);
  assert.match(routes, /bucket:\s*'create-order'/);
  assert.match(server, /koa:\s*env\.bool\('TRUST_PROXY'/);
});
