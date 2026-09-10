// import type { Core } from '@strapi/strapi';

const { assertProductionReady } = require('./utils/production-readiness');
const { migrateArtworkPrices, migrateArtworkTierPrices } = require('./utils/artwork-price-migration');
const { migrateArtworkDimensions } = require('./utils/artwork-dimensions-migration');

const STRAPI_ARTWORK_UID = 'api::artwork.artwork';

let paymentMaintenanceTimer: ReturnType<typeof setInterval> | undefined;
let paymentMaintenanceStartup: ReturnType<typeof setTimeout> | undefined;

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {
    assertProductionReady(process.env);
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi } /*: { strapi: Core.Strapi } */) {
    await migrateArtworkPrices(strapi);
    await migrateArtworkTierPrices(strapi);
    await migrateArtworkDimensions(strapi);

    await strapi.db.query(STRAPI_ARTWORK_UID).updateMany({
      where: {
        isAvailable: false,
        $or: [
          { availabilityStatus: { $null: true } },
          { availabilityStatus: 'available' },
        ],
      },
      data: { availabilityStatus: 'sold', isAvailable: false },
    });

    await strapi.db.query(STRAPI_ARTWORK_UID).updateMany({
      where: {
        isAvailable: { $ne: false },
        availabilityStatus: { $null: true },
      },
      data: { availabilityStatus: 'available', isAvailable: true },
    });

    const runMaintenance = async () => {
      try {
        await strapi.controller('api::order.order').runPaymentMaintenance();
      } catch (error) {
        strapi.log.warn(`[payment-maintenance] ${error.message}`);
      }
    };

    paymentMaintenanceStartup = setTimeout(runMaintenance, 30000);
    paymentMaintenanceTimer = setInterval(runMaintenance, 5 * 60 * 1000);
    paymentMaintenanceStartup.unref?.();
    paymentMaintenanceTimer.unref?.();
  },

  destroy() {
    if (paymentMaintenanceStartup) clearTimeout(paymentMaintenanceStartup);
    if (paymentMaintenanceTimer) clearInterval(paymentMaintenanceTimer);
  },
};
