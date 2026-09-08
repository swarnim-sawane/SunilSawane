const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

function requireTypeScriptModule(relativePath) {
  const filename = path.resolve(__dirname, relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
    },
    fileName: filename,
  });
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod._compile(outputText, filename);
  return mod.exports;
}

const utils = requireTypeScriptModule('../src/api/order/utils/payment-utils.ts');
const {
  buildShippingAddress,
  getReservationExpiry,
  getRazorpayPaymentState,
  isOrderTransitionAllowed,
  normalizeCartItems,
  validateCapturedPayment,
  validateCustomer,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} = utils;

test('normalizes cart items and rejects invalid quantities', () => {
  assert.deepEqual(
    normalizeCartItems([
      { documentId: 'abc123', quantity: '1' },
      { id: 4, quantity: 1 },
    ]),
    [
      { documentId: 'abc123', quantity: 1 },
      { id: 4, quantity: 1 },
    ]
  );

  assert.throws(
    () => normalizeCartItems([{ documentId: 'abc123', quantity: 0 }]),
    /one-of-one/
  );
  assert.throws(
    () => normalizeCartItems([
      { documentId: 'abc123', quantity: 1 },
      { documentId: 'abc123', quantity: 1 },
    ]),
    /Duplicate artwork/
  );
});

test('validates customer fields required for order creation', () => {
  const customer = validateCustomer({
    firstName: 'Sunil',
    lastName: 'Sawane',
    email: 'sunil@example.com',
    phone: '+919810238984',
    address: 'Studio Road',
    city: 'Gurgaon',
    state: 'Haryana',
    pincode: '122001',
    country: 'India',
  });

  assert.equal(customer.email, 'sunil@example.com');
  assert.equal(customer.firstName, 'Sunil');
  assert.throws(() => validateCustomer({ ...customer, email: 'bad' }), /Invalid email/);
});

test('builds a compact shipping address', () => {
  assert.equal(
    buildShippingAddress({
      address: 'Studio Road',
      city: 'Gurgaon',
      state: 'Haryana',
      pincode: '122001',
      country: 'India',
    }),
    'Studio Road, Gurgaon, Haryana - 122001, India'
  );
});

test('verifies Razorpay payment signatures', () => {
  const orderId = 'order_123';
  const paymentId = 'pay_456';
  const secret = 'test_secret';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  assert.equal(verifyRazorpaySignature(orderId, paymentId, signature, secret), true);
  assert.equal(verifyRazorpaySignature(orderId, paymentId, 'bad', secret), false);
});

test('verifies Razorpay webhooks against the untouched request body', () => {
  const rawBody = '{"event":"payment.captured","payload":{"amount":500000}}';
  const secret = 'webhook_secret';
  const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  assert.equal(verifyRazorpayWebhookSignature(rawBody, signature, secret), true);
  assert.equal(verifyRazorpayWebhookSignature(`${rawBody} `, signature, secret), false);
  assert.equal(verifyRazorpayWebhookSignature(rawBody, 'invalid', secret), false);
});

test('accepts only a captured Razorpay payment for the expected order and total', () => {
  const payment = {
    id: 'pay_456',
    order_id: 'order_123',
    amount: 500000,
    currency: 'INR',
    status: 'captured',
    captured: true,
  };

  assert.equal(validateCapturedPayment(payment, {
    paymentId: 'pay_456',
    orderId: 'order_123',
    amount: 500000,
    currency: 'INR',
  }), true);

  assert.throws(
    () => validateCapturedPayment({ ...payment, amount: 499900 }, {
      paymentId: 'pay_456', orderId: 'order_123', amount: 500000, currency: 'INR',
    }),
    /amount/i
  );
  assert.throws(
    () => validateCapturedPayment({ ...payment, status: 'authorized', captured: false }, {
      paymentId: 'pay_456', orderId: 'order_123', amount: 500000, currency: 'INR',
    }),
    /captured/i
  );
  assert.throws(
    () => validateCapturedPayment({ ...payment, order_id: 'order_other' }, {
      paymentId: 'pay_456', orderId: 'order_123', amount: 500000, currency: 'INR',
    }),
    /order/i
  );
});

test('enforces one-of-one quantities and a bounded cart', () => {
  assert.throws(
    () => normalizeCartItems([{ documentId: 'abc123', quantity: 2 }]),
    /one-of-one/i
  );
  assert.throws(
    () => normalizeCartItems(Array.from({ length: 11 }, (_, index) => ({
      documentId: `artwork-${index}`,
      quantity: 1,
    }))),
    /too many/i
  );
});

test('allows only deliberate order lifecycle transitions', () => {
  assert.equal(isOrderTransitionAllowed('pending', 'confirmed'), true);
  assert.equal(isOrderTransitionAllowed('pending', 'expired'), true);
  assert.equal(isOrderTransitionAllowed('confirmed', 'processing'), true);
  assert.equal(isOrderTransitionAllowed('confirmed', 'pending'), false);
  assert.equal(isOrderTransitionAllowed('delivered', 'pending'), false);
  assert.equal(isOrderTransitionAllowed('confirmed', 'confirmed'), true);
});

test('creates a bounded reservation expiry timestamp', () => {
  const now = new Date('2026-09-08T10:00:00.000Z');
  assert.equal(
    getReservationExpiry(now, 15).toISOString(),
    '2026-09-08T10:15:00.000Z'
  );
  assert.throws(() => getReservationExpiry(now, 0), /reservation/i);
  assert.throws(() => getReservationExpiry(now, 61), /reservation/i);
});

test('keeps an authorized gateway payment reserved until capture settles', () => {
  assert.equal(getRazorpayPaymentState([
    { id: 'pay_authorized', status: 'authorized', captured: false },
  ]).active.id, 'pay_authorized');

  assert.equal(getRazorpayPaymentState([
    { id: 'pay_authorized', status: 'authorized', captured: false },
    { id: 'pay_captured', status: 'captured', captured: true },
  ]).captured.id, 'pay_captured');

  assert.deepEqual(getRazorpayPaymentState([
    { id: 'pay_failed', status: 'failed', captured: false },
  ]), { captured: null, active: null });
});
