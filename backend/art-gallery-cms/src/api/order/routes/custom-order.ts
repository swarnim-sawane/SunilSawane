export default {
  routes: [
    {
      method: 'POST',
      path: '/orders/create-razorpay-order',
      handler: 'order.createRazorpayOrder',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/orders/verify-payment',
      handler: 'order.verifyPayment',
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
      },
    },
  ],
};
