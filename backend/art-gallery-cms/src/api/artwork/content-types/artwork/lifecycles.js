'use strict';

const { getAvailabilityMutation } = require('../../utils/availability');
const { FEATURED_PRICE, STANDARD_PRICE } = require('../../../../utils/artwork-price-migration');

function synchronizeAvailability(event) {
  const data = event?.params?.data;
  if (!data) return;
  Object.assign(data, getAvailabilityMutation(data));
}

function synchronizePrice(event, isCreate = false) {
  const data = event?.params?.data;
  if (!data) return;

  const changesFeaturedFlag = Object.prototype.hasOwnProperty.call(data, 'isFeatured');
  if (isCreate || changesFeaturedFlag) {
    data.price = data.isFeatured === true ? FEATURED_PRICE : STANDARD_PRICE;
  }
}

module.exports = {
  beforeCreate(event) {
    synchronizeAvailability(event);
    synchronizePrice(event, true);
  },
  beforeUpdate(event) {
    synchronizeAvailability(event);
    synchronizePrice(event);
  },
};
