'use strict';

const { getAvailabilityMutation } = require('../../utils/availability');

function synchronizeAvailability(event) {
  const data = event?.params?.data;
  if (!data) return;
  Object.assign(data, getAvailabilityMutation(data));
}

module.exports = {
  beforeCreate: synchronizeAvailability,
  beforeUpdate: synchronizeAvailability,
};
