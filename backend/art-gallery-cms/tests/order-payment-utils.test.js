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
  normalizeCartItems,
  validateCustomer,
  verifyRazorpaySignature,
} = utils;

test('normalizes cart items and rejects invalid quantities', () => {
  assert.deepEqual(
    normalizeCartItems([
      { documentId: 'abc123', quantity: '2' },
      { id: 4, quantity: 1 },
    ]),
    [
      { documentId: 'abc123', quantity: 2 },
      { id: 4, quantity: 1 },
    ]
  );

  assert.throws(
    () => normalizeCartItems([{ documentId: 'abc123', quantity: 0 }]),
    /Invalid quantity/
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
