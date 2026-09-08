const assert = require('node:assert/strict');
const test = require('node:test');

const {
  getAvailabilityMutation,
  getArtworkAvailabilityStatus,
  isArtworkPurchasable,
} = require('../src/api/artwork/utils/availability');

test('normalizes explicit artwork statuses and legacy availability records', () => {
  assert.equal(getArtworkAvailabilityStatus({ availabilityStatus: 'available', isAvailable: true }), 'available');
  assert.equal(getArtworkAvailabilityStatus({ availabilityStatus: 'reserved', isAvailable: false }), 'reserved');
  assert.equal(getArtworkAvailabilityStatus({ availabilityStatus: 'sold', isAvailable: false }), 'sold');
  assert.equal(getArtworkAvailabilityStatus({ availabilityStatus: 'not_for_sale', isAvailable: false }), 'not_for_sale');
  assert.equal(getArtworkAvailabilityStatus({ isAvailable: false }), 'sold');
  assert.equal(getArtworkAvailabilityStatus({ isAvailable: true }), 'available');
  assert.equal(getArtworkAvailabilityStatus({ availabilityStatus: 'unknown', isAvailable: true }), 'available');
});

test('only explicitly available artwork is purchasable', () => {
  assert.equal(isArtworkPurchasable({ availabilityStatus: 'available', isAvailable: true }), true);
  assert.equal(isArtworkPurchasable({ availabilityStatus: 'reserved', isAvailable: false }), false);
  assert.equal(isArtworkPurchasable({ availabilityStatus: 'sold', isAvailable: false }), false);
  assert.equal(isArtworkPurchasable({ availabilityStatus: 'not_for_sale', isAvailable: false }), false);
  assert.equal(isArtworkPurchasable({ availabilityStatus: 'available', isAvailable: false }), false);
});

test('keeps the new status and legacy toggle synchronized', () => {
  assert.deepEqual(getAvailabilityMutation({ availabilityStatus: 'reserved' }), {
    availabilityStatus: 'reserved',
    isAvailable: false,
  });
  assert.deepEqual(getAvailabilityMutation({ availabilityStatus: 'not_for_sale' }), {
    availabilityStatus: 'not_for_sale',
    isAvailable: false,
  });
  assert.deepEqual(getAvailabilityMutation({ isAvailable: false }), {
    availabilityStatus: 'sold',
    isAvailable: false,
  });
  assert.deepEqual(getAvailabilityMutation({ isAvailable: true }), {
    availabilityStatus: 'available',
    isAvailable: true,
  });
});

test('content audit requires valid status and prices only sale catalogue records', () => {
  const { getMissingFields } = require('../scripts/audit-artwork-readiness');
  const complete = {
    dimensions: '18 x 24 in',
    medium: 'Pen and ink',
    shippingNote: 'Confirmed after address review',
    certificateNote: 'Signed certificate included',
    yearCreated: 2024,
    isAvailable: false,
    framingStatus: 'unframed',
  };

  assert.equal(
    getMissingFields({ ...complete, availabilityStatus: 'not_for_sale' }).includes('price'),
    false
  );
  assert.equal(
    getMissingFields({ ...complete, availabilityStatus: 'available', isAvailable: true }).includes('price'),
    true
  );
  assert.equal(
    getMissingFields({ ...complete, availabilityStatus: 'unknown' }).includes('availabilityStatus'),
    true
  );
});
