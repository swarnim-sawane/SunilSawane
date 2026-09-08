'use strict';

const ARTWORK_AVAILABILITY_STATUSES = Object.freeze([
  'available',
  'reserved',
  'sold',
  'not_for_sale',
]);

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function getLegacyAvailability(artwork) {
  if (artwork?.isAvailable === false || artwork?.IsAvailable === false ||
      artwork?.inStock === false || artwork?.InStock === false) {
    return false;
  }
  return true;
}

function getArtworkAvailabilityStatus(artwork = {}) {
  const rawStatus = String(
    artwork.availabilityStatus || artwork.AvailabilityStatus || ''
  ).trim().toLowerCase();
  const legacyAvailable = getLegacyAvailability(artwork);

  if (rawStatus === 'available' && !legacyAvailable) return 'sold';
  if (ARTWORK_AVAILABILITY_STATUSES.includes(rawStatus)) return rawStatus;
  return legacyAvailable ? 'available' : 'sold';
}

function isArtworkPurchasable(artwork) {
  return getArtworkAvailabilityStatus(artwork) === 'available' &&
    getLegacyAvailability(artwork);
}

function getAvailabilityMutation(data = {}) {
  if (hasOwn(data, 'availabilityStatus')) {
    const status = String(data.availabilityStatus || '').trim().toLowerCase();
    if (!ARTWORK_AVAILABILITY_STATUSES.includes(status)) return {};
    return {
      availabilityStatus: status,
      isAvailable: status === 'available',
    };
  }

  if (hasOwn(data, 'isAvailable')) {
    const isAvailable = data.isAvailable !== false;
    return {
      availabilityStatus: isAvailable ? 'available' : 'sold',
      isAvailable,
    };
  }

  return {};
}

module.exports = {
  ARTWORK_AVAILABILITY_STATUSES,
  getAvailabilityMutation,
  getArtworkAvailabilityStatus,
  isArtworkPurchasable,
};
