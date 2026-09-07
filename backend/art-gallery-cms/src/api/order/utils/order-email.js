'use strict';

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
      to: artistEmail,
      from,
      subject: `New paid artwork order ${orderNumber}`,
      text: artistText,
    },
    {
      to: clean(order.customerEmail),
      from,
      subject: `Order confirmed ${orderNumber}`,
      text: collectorText,
    },
  ].filter((message) => message.to && message.from);
}

async function notifyOrderConfirmed(strapi, order, env = process.env) {
  const emailService = strapi?.plugin?.('email')?.service?.('email');

  if (!emailService?.send) {
    throw new Error('Strapi email service is not available');
  }

  const messages = buildOrderEmailMessages(order, env);
  for (const message of messages) {
    await emailService.send(message);
  }

  return messages.length;
}

module.exports = {
  buildOrderEmailMessages,
  notifyOrderConfirmed,
};
