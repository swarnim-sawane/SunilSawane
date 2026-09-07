const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const backendRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(backendRoot, file), 'utf8');

test('order public receipt route is scoped to confirmed receipt display', () => {
  const routes = read('src/api/order/routes/custom-order.ts');
  const controller = read('src/api/order/controllers/order.ts');
  const publicSerializer = controller.slice(
    controller.indexOf('function serializePublicReceipt'),
    controller.indexOf('async function markPurchasedArtworksUnavailable')
  );

  assert.match(routes, /method:\s*'GET'[\s\S]*path:\s*'\/orders\/receipt\/:orderNumber'/);
  assert.match(routes, /handler:\s*'order\.publicReceipt'/);
  assert.match(routes, /auth:\s*false/);

  assert.match(controller, /async publicReceipt\(ctx\)/);
  assert.match(controller, /\^ORD-\\d\{10,20\}\$/);
  assert.match(controller, /orderStatus:\s*'confirmed'/);
  assert.match(controller, /publishedAt:\s*\{[\s\S]*\$notNull:\s*true/s);
  assert.match(controller, /serializePublicReceipt\(order\)/);
  assert.match(publicSerializer, /publicReceipt:\s*true/);
  assert.doesNotMatch(publicSerializer, /customerEmail/);
  assert.doesNotMatch(publicSerializer, /shippingAddress/);
  assert.doesNotMatch(publicSerializer, /paymentSignature/);
});

test('checkout artwork lookup ignores draft rows for available works', () => {
  const controller = read('src/api/order/controllers/order.ts');
  const fetchArtwork = controller.slice(
    controller.indexOf('async function fetchArtwork'),
    controller.indexOf('async function buildOrderItems')
  );

  assert.match(fetchArtwork, /publishedAt:\s*\{[\s\S]*\$notNull:\s*true/s);
});
