const assert = require('node:assert/strict');
const test = require('node:test');

const availability = require('../js/artwork-availability');

test('maps artwork records to collector-facing availability states', () => {
  assert.equal(availability.getStatus({ availabilityStatus: 'available', isAvailable: true }), 'available');
  assert.equal(availability.getStatus({ availabilityStatus: 'reserved', isAvailable: false }), 'reserved');
  assert.equal(availability.getStatus({ availabilityStatus: 'sold', isAvailable: false }), 'sold');
  assert.equal(availability.getStatus({ availabilityStatus: 'not_for_sale', isAvailable: false }), 'not_for_sale');
  assert.equal(availability.getStatus({ isAvailable: false }), 'sold');
  assert.equal(availability.getStatus({ availabilityStatus: 'available', isAvailable: false }), 'sold');
});

test('only available artwork exposes purchase actions', () => {
  assert.equal(availability.isPurchasable({ availabilityStatus: 'available', isAvailable: true }), true);
  assert.equal(availability.isPurchasable({ availabilityStatus: 'reserved', isAvailable: false }), false);
  assert.equal(availability.isPurchasable({ availabilityStatus: 'sold', isAvailable: false }), false);
  assert.equal(availability.isPurchasable({ availabilityStatus: 'not_for_sale', isAvailable: false }), false);
});

test('provides concise status and enquiry language for every unavailable state', () => {
  assert.equal(availability.getStatusLabel('sold'), 'Sold');
  assert.equal(availability.getStatusLabel('reserved'), 'Reserved');
  assert.equal(availability.getStatusLabel('not_for_sale'), 'Not for sale');
  assert.equal(availability.getPurchaseLabel('sold'), 'Sold');
  assert.equal(availability.getEnquiryLabel('sold'), 'Request a Similar Work');
  assert.equal(availability.getEnquiryLabel('reserved'), 'Enquire About Availability');
  assert.equal(availability.getEnquiryLabel('not_for_sale'), 'Enquire About This Work');
});

test('sorts available artwork before unavailable catalogue records', () => {
  const works = [
    { title: 'Sold', availabilityStatus: 'sold', isAvailable: false },
    { title: 'Available', availabilityStatus: 'available', isAvailable: true },
    { title: 'Reserved', availabilityStatus: 'reserved', isAvailable: false },
    { title: 'Not for sale', availabilityStatus: 'not_for_sale', isAvailable: false },
  ];

  assert.deepEqual(
    [...works].sort(availability.compareAvailability).map((work) => work.title),
    ['Available', 'Reserved', 'Sold', 'Not for sale']
  );
});

test('keeps unavailable catalogue records visible without requiring a price', () => {
  assert.equal(availability.shouldShowInShop({ price: 5000, availabilityStatus: 'available' }), true);
  assert.equal(availability.shouldShowInShop({ price: 0, availabilityStatus: 'available' }), false);
  assert.equal(availability.shouldShowInShop({ price: 0, availabilityStatus: 'sold' }), true);
  assert.equal(availability.shouldShowInShop({ availabilityStatus: 'not_for_sale' }), true);
  assert.equal(availability.shouldShowInShop({ availabilityStatus: 'reserved' }), true);
});
