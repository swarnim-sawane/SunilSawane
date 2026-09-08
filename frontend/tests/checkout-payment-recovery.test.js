const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const frontendRoot = path.resolve(__dirname, '..');
const checkout = fs.readFileSync(path.join(frontendRoot, 'js', 'checkout.js'), 'utf8');

test('checkout releases an unpaid reservation when Razorpay is dismissed', () => {
  assert.match(checkout, /releaseCheckoutReservation/);
  assert.match(checkout, /\/orders\/release-reservation/);
  assert.match(checkout, /reservationToken/);
  assert.match(checkout, /ondismiss:\s*async function/);
});

test('checkout exposes payment failure recovery without clearing the cart', () => {
  assert.match(checkout, /razorpay\.on\('payment\.failed'/);
  assert.match(checkout, /Payment attempt failed\. Try again/);
  assert.match(checkout, /setPaymentButtonLoading\(false/);
  assert.doesNotMatch(checkout, /payment\.failed[\s\S]{0,300}cart\.clear\(\)/);
});
