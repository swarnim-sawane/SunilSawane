export default {
  routes: [
    {
      method: 'POST',
      path: '/orders/create-razorpay-order',
      handler: 'order.createRazorpayOrder',
      config: {
        auth: false,
        policies: [
          {
            name: 'global::payment-rate-limit',
            config: { bucket: 'create-order', limit: 3, windowMs: 600000 },
          },
        ],
      },
    },
    {
      method: 'POST',
      path: '/orders/verify-payment',
      handler: 'order.verifyPayment',
      config: {
        auth: false,
        policies: [
          {
            name: 'global::payment-rate-limit',
            config: { bucket: 'verify-payment', limit: 30, windowMs: 600000 },
          },
        ],
      },
    },
    {
      method: 'POST',
      path: '/orders/release-reservation',
      handler: 'order.releaseReservation',
      config: {
        auth: false,
        policies: [
          {
            name: 'global::payment-rate-limit',
            config: { bucket: 'release-reservation', limit: 30, windowMs: 600000 },
          },
        ],
      },
    },
    {
      method: 'POST',
      path: '/orders/razorpay-webhook',
      handler: 'order.razorpayWebhook',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/orders/receipt/:orderNumber',
      handler: 'order.publicReceipt',
      config: {
        auth: false,
        policies: [
          {
            name: 'global::payment-rate-limit',
            config: { bucket: 'receipt', limit: 60, windowMs: 600000 },
          },
        ],
      },
    },
  ],
};
