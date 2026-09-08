'use strict';

const nodemailer = require('nodemailer');

function clean(value) {
  return String(value || '').trim();
}

function formatINR(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function listOrderItems(order) {
  const items = Array.isArray(order.orderItems) ? order.orderItems : [];

  if (items.length === 0) {
    return 'Artwork details are available in Strapi.';
  }

  return items.map((item) => {
    const title = clean(item.title) || 'Artwork';
    const quantity = Number(item.quantity || 1);
    const price = formatINR(item.price || 0);
    const details = [
      item.medium && `Medium: ${item.medium}`,
      item.dimensions && `Size: ${item.dimensions}`,
      item.framingStatus && `Framing: ${String(item.framingStatus).replace(/_/g, ' ')}`,
    ].filter(Boolean).join(' | ');

    return `- ${title} x ${quantity} at ${price}${details ? ` (${details})` : ''}`;
  }).join('\n');
}

function getReceiptUrl(order, env = process.env) {
  const publicUrl = clean(env.PUBLIC_URL).replace(/\/+$/, '');
  if (!publicUrl || !order.orderNumber) {
    return '';
  }

  return `${publicUrl}/api/orders/receipt/${encodeURIComponent(order.orderNumber)}`;
}

function buildOrderEmailMessages(order, env = process.env) {
  const artistEmail = clean(env.ORDER_NOTIFICATION_EMAIL);
  const from = clean(env.ORDER_EMAIL_FROM) || artistEmail;
  const receiptUrl = getReceiptUrl(order, env);
  const orderNumber = clean(order.orderNumber);
  const customerName = clean(order.customerName) || 'Collector';
  const total = formatINR(order.totalAmount);
  const items = listOrderItems(order);

  const artistText = [
    `New paid artwork order: ${orderNumber}`,
    '',
    `Collector: ${customerName}`,
    `Email: ${clean(order.customerEmail)}`,
    `Phone: ${clean(order.customerPhone) || 'Not provided'}`,
    `Shipping address: ${clean(order.shippingAddress) || 'Not provided'}`,
    `Total: ${total}`,
    '',
    'Artwork:',
    items,
    '',
    order.orderNotes ? `Collector note: ${clean(order.orderNotes)}` : '',
    receiptUrl ? `Receipt: ${receiptUrl}` : '',
  ].filter((line) => line !== '').join('\n');

  const collectorText = [
    `Your artwork order is confirmed: ${orderNumber}`,
    '',
    `Thank you, ${customerName}. The selected original artwork has been reserved for you after successful payment.`,
    '',
    'Artwork:',
    items,
    '',
    `Order total: ${total}`,
    '',
    'The artwork will be packed carefully before dispatch. Certificate and authenticity details will accompany the collector handoff according to the artwork record.',
    receiptUrl ? `Public receipt: ${receiptUrl}` : '',
  ].filter((line) => line !== '').join('\n');

  return [
    {
      recipientType: 'artist',
      to: artistEmail,
      from,
      subject: `New paid artwork order ${orderNumber}`,
      text: artistText,
    },
    {
      recipientType: 'collector',
      to: clean(order.customerEmail),
      from,
      subject: `Order confirmed ${orderNumber}`,
      text: collectorText,
    },
  ].filter((message) => message.to && message.from);
}

async function notifyOrderConfirmed(strapi, order, env = process.env) {
  const smtpConfigured = Boolean(clean(env.SMTP_HOST));
  const smtpSecure = ['1', 'true', 'yes'].includes(clean(env.SMTP_SECURE).toLowerCase());
  const emailService = smtpConfigured
    ? nodemailer.createTransport({
      host: clean(env.SMTP_HOST),
      port: Number(env.SMTP_PORT || 587),
      secure: smtpSecure,
      requireTLS: !smtpSecure,
      tls: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
      disableFileAccess: true,
      disableUrlAccess: true,
      auth: {
        user: clean(env.SMTP_USERNAME),
        pass: clean(env.SMTP_PASSWORD),
      },
    })
    : strapi?.plugin?.('email')?.service?.('email');
  const messages = buildOrderEmailMessages(order, env);
  const previous = order.emailDelivery && typeof order.emailDelivery === 'object'
    ? order.emailDelivery
    : {};
  const delivery = { ...previous };

  for (const message of messages) {
    const recipientType = message.recipientType;
    if (delivery[recipientType]?.status === 'sent') {
      continue;
    }

    const attempts = Number(delivery[recipientType]?.attempts || 0) + 1;
    try {
      const send = smtpConfigured ? emailService?.sendMail?.bind(emailService) : emailService?.send?.bind(emailService);
      if (!send) {
        throw new Error('Strapi email service is not available');
      }

      const { recipientType: _recipientType, ...email } = message;
      if (env.ORDER_REPLY_TO) email.replyTo = clean(env.ORDER_REPLY_TO);
      await send(email);
      delivery[recipientType] = {
        status: 'sent',
        attempts,
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      delivery[recipientType] = {
        status: 'failed',
        attempts,
        lastError: String(error?.message || error).slice(0, 500),
      };
    }
  }

  const states = ['artist', 'collector']
    .filter((recipientType) => messages.some((message) => message.recipientType === recipientType))
    .map((recipientType) => delivery[recipientType]?.status);
  const status = states.length > 0 && states.every((state) => state === 'sent')
    ? 'sent'
    : states.some((state) => state === 'sent')
      ? 'partial'
      : 'failed';

  return { status, delivery };
}

module.exports = {
  buildOrderEmailMessages,
  notifyOrderConfirmed,
};
