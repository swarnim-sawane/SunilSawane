'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order', ({ strapi }) => ({
  async sendConfirmation(ctx) {
    try {
      const { email, name, orderId, items, total } = ctx.request.body;
      
      await strapi.plugins['email'].services.email.send({
        to: email,
        from: 'noreply@sunilartgallery.com',
        subject: `Order Confirmation - ${orderId}`,
        html: `
          <h2>Thank you for your order, ${name}!</h2>
          <p>Order ID: ${orderId}</p>
          <p>Total: ₹${total}</p>
          <h3>Items:</h3>
          <ul>
            ${items.map(item => `<li>${item.title} x ${item.quantity}</li>`).join('')}
          </ul>
        `
      });
      
      ctx.send({ success: true });
    } catch (error) {
      ctx.throw(500, error);
    }
  }
}));
