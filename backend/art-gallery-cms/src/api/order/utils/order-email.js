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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderArtworkRows(order) {
  const items = Array.isArray(order.orderItems) ? order.orderItems : [];
  if (items.length === 0) {
    return '<tr><td style="padding:18px 0;color:#6f6a63;font:15px/1.6 Arial,Helvetica,sans-serif;">Artwork details are available in the gallery administration.</td></tr>';
  }

  return items.map((item) => {
    const details = [item.medium, item.dimensions, item.yearCreated]
      .map(clean)
      .filter(Boolean)
      .map(escapeHtml)
      .join(' &nbsp;&middot;&nbsp; ');
    return `<tr>
      <td style="padding:20px 0;border-bottom:1px solid #dedbd4;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding-right:16px;vertical-align:top;">
              <div style="color:#211f1c;font:600 18px/1.35 Georgia,'Times New Roman',serif;">${escapeHtml(clean(item.title) || 'Artwork')}</div>
              ${details ? `<div style="padding-top:6px;color:#746f67;font:13px/1.55 Arial,Helvetica,sans-serif;">${details}</div>` : ''}
            </td>
            <td align="right" style="width:110px;vertical-align:top;color:#211f1c;font:600 16px/1.4 Georgia,'Times New Roman',serif;white-space:nowrap;">${escapeHtml(formatINR(item.price || 0))}</td>
          </tr>
        </table>
      </td>
    </tr>`;
  }).join('');
}

function renderReceiptButton(receiptUrl, label = 'VIEW ORDER RECEIPT') {
  if (!receiptUrl) return '';
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:26px;">
    <tr><td bgcolor="#211f1c" style="border-radius:2px;"><a href="${escapeHtml(receiptUrl)}" style="display:inline-block;padding:14px 22px;color:#ffffff;text-decoration:none;font:600 12px/1 Arial,Helvetica,sans-serif;letter-spacing:0;">${escapeHtml(label)}</a></td></tr>
  </table>`;
}

function renderEmailShell({ preheader, label, title, intro, orderNumber, total, content, footer }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1efe9;color:#211f1c;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f1efe9;">
    <tr><td align="center" style="padding:32px 14px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#fbfaf7;border:1px solid #dedbd4;">
        <tr><td style="height:5px;background:#787d62;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:34px 42px 30px;">
          <div style="color:#94372b;font:600 12px/1.4 Arial,Helvetica,sans-serif;letter-spacing:0;">SUNIL A. SAWANE</div>
          <div style="padding-top:5px;color:#777168;font:11px/1.5 Arial,Helvetica,sans-serif;letter-spacing:0;">ORIGINAL ARTWORKS</div>
          <div style="margin-top:28px;padding-top:24px;border-top:1px solid #dedbd4;color:#787d62;font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:0;">${escapeHtml(label)}</div>
          <h1 style="margin:10px 0 12px;color:#211f1c;font:400 30px/1.22 Georgia,'Times New Roman',serif;letter-spacing:0;">${escapeHtml(title)}</h1>
          <p style="margin:0;color:#625d56;font:15px/1.7 Arial,Helvetica,sans-serif;">${escapeHtml(intro)}</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:26px;background:#f4f2ed;border-left:3px solid #94372b;">
            <tr>
              <td style="padding:16px 18px;color:#746f67;font:11px/1.4 Arial,Helvetica,sans-serif;">ORDER<br><strong style="color:#211f1c;font-size:14px;">${escapeHtml(orderNumber)}</strong></td>
              <td align="right" style="padding:16px 18px;color:#746f67;font:11px/1.4 Arial,Helvetica,sans-serif;">TOTAL<br><strong style="color:#211f1c;font:600 17px/1.4 Georgia,'Times New Roman',serif;">${escapeHtml(total)}</strong></td>
            </tr>
          </table>
          ${content}
        </td></tr>
        <tr><td style="padding:22px 42px;background:#211f1c;color:#cbc6bd;font:12px/1.65 Arial,Helvetica,sans-serif;">${footer}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
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
  const artworkRows = renderArtworkRows(order);

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

  const artistHtml = renderEmailShell({
    preheader: `Paid order ${orderNumber} requires fulfilment.`,
    label: 'NEW PAID ORDER',
    title: 'A new artwork has been acquired',
    intro: 'Payment has been verified. The collector and fulfilment details are ready below.',
    orderNumber,
    total,
    content: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:12px;">${artworkRows}</table>
      <div style="margin-top:28px;color:#787d62;font:600 11px/1.4 Arial,Helvetica,sans-serif;">COLLECTOR &amp; DELIVERY</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:10px;background:#f4f2ed;">
        <tr><td style="padding:18px;color:#625d56;font:14px/1.7 Arial,Helvetica,sans-serif;">
          <strong style="color:#211f1c;">${escapeHtml(customerName)}</strong><br>
          ${escapeHtml(clean(order.customerEmail))}<br>
          ${escapeHtml(clean(order.customerPhone) || 'Phone not provided')}<br>
          ${escapeHtml(clean(order.shippingAddress) || 'Shipping address not provided')}
          ${order.orderNotes ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #dedbd4;"><strong style="color:#211f1c;">Collector note:</strong> ${escapeHtml(clean(order.orderNotes))}</div>` : ''}
        </td></tr>
      </table>
      ${renderReceiptButton(receiptUrl, 'OPEN ORDER RECEIPT')}`,
    footer: 'Artist order notification. Verify the artwork, packing requirements and collector address before dispatch.',
  });

  const collectorHtml = renderEmailShell({
    preheader: `Your artwork order ${orderNumber} is confirmed.`,
    label: 'PAYMENT RECEIVED',
    title: 'YOUR ACQUISITION IS CONFIRMED',
    intro: `Thank you, ${customerName}. Your selected original artwork is now reserved in your name.`,
    orderNumber,
    total,
    content: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:12px;">${artworkRows}</table>
      <div style="margin-top:28px;color:#787d62;font:600 11px/1.4 Arial,Helvetica,sans-serif;">WHAT HAPPENS NEXT</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:10px;">
        <tr><td style="padding:0 0 12px;color:#625d56;font:14px/1.65 Arial,Helvetica,sans-serif;"><strong style="color:#211f1c;">Careful packing</strong><br>The artwork will be prepared for safe dispatch.</td></tr>
        <tr><td style="padding:12px 0;border-top:1px solid #dedbd4;color:#625d56;font:14px/1.65 Arial,Helvetica,sans-serif;"><strong style="color:#211f1c;">Direct coordination</strong><br>Shipping and delivery details will be confirmed with you.</td></tr>
        <tr><td style="padding:12px 0 0;border-top:1px solid #dedbd4;color:#625d56;font:14px/1.65 Arial,Helvetica,sans-serif;"><strong style="color:#211f1c;">Authenticity included</strong><br>Certificate details will accompany the collector handoff.</td></tr>
      </table>
      ${renderReceiptButton(receiptUrl)}`,
    footer: 'Thank you for collecting an original work by Sunil A. Sawane. Keep this email for your order reference.',
  });

  return [
    {
      recipientType: 'artist',
      to: artistEmail,
      from,
      subject: `New paid artwork order ${orderNumber}`,
      text: artistText,
      html: artistHtml,
    },
    {
      recipientType: 'collector',
      to: clean(order.customerEmail),
      from,
      subject: `Order confirmed ${orderNumber}`,
      text: collectorText,
      html: collectorHtml,
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
