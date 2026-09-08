// import type { Core } from '@strapi/strapi';

const { assertProductionReady } = require('./utils/production-readiness');

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
  bootstrap({ strapi } /*: { strapi: Core.Strapi } */) {
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
