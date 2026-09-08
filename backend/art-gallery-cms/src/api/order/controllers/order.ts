'use strict';

const nodeCrypto = require('node:crypto');
const { createCoreController } = require('@strapi/strapi').factories;
const {
  buildShippingAddress,
  getReservationExpiry,
  getRazorpayPaymentState,
  normalizeCartItems,
  validateCapturedPayment,
  validateCustomer,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} = require('../utils/payment-utils');
const { notifyOrderConfirmed } = require('../utils/order-email');

const STRAPI_ARTWORK_UID = 'api::artwork.artwork';
const STRAPI_ORDER_UID = 'api::order.order';
const STRAPI_PAYMENT_EVENT_UID = 'api::payment-event.payment-event';
const PAYMENT_CURRENCY = 'INR';

function httpError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

function getRazorpayConfig({ webhook = false } = {}) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!keyId || !keySecret) throw httpError('Payment gateway is not configured', 500);
  if (webhook && !webhookSecret) throw httpError('Payment webhook is not configured', 500);
  return { keyId, keySecret, webhookSecret };
}

function getReservationMinutes() {
  const configured = Number(process.env.PAYMENT_RESERVATION_MINUTES || 20);
  return Number.isFinite(configured) && configured >= 1 && configured <= 60 ? configured : 20;
}

function toMoney(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) > 1000000000) {
    throw httpError('Artwork has invalid price');
  }
  return amount;
}

function makeOrderNumber() {
  return `ORD-${Date.now()}${nodeCrypto.randomInt(100000, 1000000)}`;
}

function createReservationToken() {
  return nodeCrypto.randomBytes(32).toString('base64url');
}

function hashReservationToken(token) {
  return nodeCrypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function createReservationOwnerHash(ctx) {
  const secret = String(process.env.API_TOKEN_SALT || '').trim();
  if (!secret) throw httpError('Checkout security is not configured', 500);
  const ip = String(ctx.request?.ip || ctx.ip || 'unknown');
  return nodeCrypto.createHmac('sha256', secret).update(ip).digest('hex');
}

function getMaxReservedArtworksPerClient() {
  const configured = Number(process.env.PAYMENT_MAX_RESERVED_ARTWORKS_PER_CLIENT || 3);
  return Number.isInteger(configured) && configured >= 1 && configured <= 10 ? configured : 3;
}

async function enforceReservationQuota(strapi, reservationOwnerHash, requestedCount) {
  const activeOrders = await strapi.db.query(STRAPI_ORDER_UID).findMany({
    where: {
      reservationOwnerHash,
      orderStatus: 'pending',
      reservationExpiresAt: { $gt: new Date().toISOString() },
    },
    limit: 10,
  });
  const activeCount = activeOrders.reduce(
    (total, order) => total + (Array.isArray(order.orderItems) ? order.orderItems.length : 0),
    0
  );

  if (activeCount + requestedCount > getMaxReservedArtworksPerClient()) {
    throw httpError('Too many artworks are already held for this checkout. Complete or release the current payment first.', 429);
  }
}

function reservationTokenMatches(token, expectedHash) {
  const actual = hashReservationToken(token);
  const expected = String(expectedHash || '');
  return expected.length === actual.length
    && nodeCrypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

async function fetchArtwork(strapi, item) {
  const identityWhere = item.documentId ? { documentId: item.documentId } : { id: item.id };
  const artwork = await strapi.db.query(STRAPI_ARTWORK_UID).findOne({
    where: { ...identityWhere, publishedAt: { $notNull: true } },
    populate: { images: true, category: true },
  });

  if (!artwork || artwork.isAvailable === false) throw httpError('Artwork is not available', 409);
  return artwork;
}

async function buildOrderItems(strapi, requestedItems) {
  const normalized = normalizeCartItems(requestedItems);
  const orderItems = [];
  let total = 0;

  for (const item of normalized) {
    const artwork = await fetchArtwork(strapi, item);
    const price = toMoney(artwork.price);
    const image = Array.isArray(artwork.images) && artwork.images[0]?.url ? artwork.images[0].url : '';

    orderItems.push({
      id: artwork.id,
      documentId: artwork.documentId,
      title: artwork.title,
      price,
      quantity: 1,
      image,
      slug: artwork.slug,
      dimensions: artwork.dimensions,
      medium: artwork.medium,
      yearCreated: artwork.yearCreated,
      framingStatus: artwork.framingStatus,
      shippingNote: artwork.shippingNote,
      certificateNote: artwork.certificateNote,
    });
    total += price;
  }

  return { orderItems, total, amountInPaise: Math.round(total * 100) };
}

function getOrderArtworkIds(orderItems) {
  return [...new Set((orderItems || []).map((item) => {
    const value = Number(item.id);
    return Number.isInteger(value) ? value : null;
  }).filter(Boolean))];
}

function serializeOrder(order) {
  return {
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentId: order.paymentId,
    orderDate: order.orderDate,
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      address: order.shippingAddress,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
    },
    items: order.orderItems,
    total: Number(order.totalAmount || 0),
    orderNotes: order.orderNotes,
  };
}

function serializePublicReceipt(order) {
  return {
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    orderDate: order.orderDate,
    items: order.orderItems,
    total: Number(order.totalAmount || 0),
    publicReceipt: true,
  };
}

function getFrontendReceiptUrl(orderNumber) {
  const frontendUrl = String(process.env.FRONTEND_URL || '').trim().replace(/\/+$/, '');
  return frontendUrl
    ? `${frontendUrl}/order-success.html?order=${encodeURIComponent(orderNumber)}`
    : '';
}

async function reserveArtworks(strapi, orderItems) {
  const artworkIds = getOrderArtworkIds(orderItems);
  if (artworkIds.length !== orderItems.length) throw httpError('Order contains invalid artwork records');

  for (const artworkId of artworkIds) {
    const updated = await strapi.db.query(STRAPI_ARTWORK_UID).updateMany({
      where: { id: artworkId, isAvailable: { $ne: false } },
      data: { isAvailable: false },
    });
    if (updated.count !== 1) throw httpError('One or more artworks are no longer available', 409);
  }
  return artworkIds;
}

async function releaseReservedArtworks(strapi, orderItems) {
  for (const artworkId of getOrderArtworkIds(orderItems)) {
    await strapi.db.query(STRAPI_ARTWORK_UID).updateMany({
      where: { id: artworkId, isAvailable: false },
      data: { isAvailable: true },
    });
  }
}

async function razorpayRequest(path, options, { keyId, keySecret }) {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 10000);
  try {
    const response = await fetch(`https://api.razorpay.com/v1${path}`, {
      ...options,
      signal: abortController.signal,
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    const text = await response.text();
    let payload;
    try { payload = text ? JSON.parse(text) : {}; } catch (error) { payload = { error: text }; }
    if (!response.ok) {
      throw httpError(String(payload?.error?.description || payload?.error || 'Razorpay request failed'), 502);
    }
    return payload;
  } catch (error) {
    if (error?.name === 'AbortError') throw httpError('Razorpay request timed out', 504);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function createRazorpayOrder({ amountInPaise, orderNumber }, config) {
  return razorpayRequest('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: amountInPaise,
      currency: PAYMENT_CURRENCY,
      receipt: orderNumber,
      payment_capture: 1,
      notes: { orderNumber },
    }),
  }, config);
}

function fetchRazorpayPayment(paymentId, config) {
  if (!/^pay_[A-Za-z0-9]+$/.test(String(paymentId || ''))) throw httpError('Invalid Razorpay payment id');
  return razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`, { method: 'GET' }, config);
}

function fetchRazorpayOrderPayments(orderId, config) {
  if (!/^order_[A-Za-z0-9]+$/.test(String(orderId || ''))) throw httpError('Invalid Razorpay order id');
  return razorpayRequest(`/orders/${encodeURIComponent(orderId)}/payments`, { method: 'GET' }, config);
}

async function updateEmailDelivery(strapi, order) {
  const attemptedAt = new Date().toISOString();
  const claimed = await strapi.db.query(STRAPI_ORDER_UID).updateMany({
    where: {
      id: order.id,
      emailStatus: { $in: ['pending', 'partial', 'failed'] },
    },
    data: { emailStatus: 'sending', emailAttemptedAt: attemptedAt },
  });
  if (claimed.count !== 1) return;

  const result = await notifyOrderConfirmed(strapi, order);
  await strapi.db.query(STRAPI_ORDER_UID).update({
    where: { id: order.id },
    data: { emailStatus: result.status, emailDelivery: result.delivery },
  });
}

async function publishOrderDocument(strapi, order) {
  if (!order?.documentId) throw httpError('Order document cannot be published', 500);
  await strapi.documents(STRAPI_ORDER_UID).publish({ documentId: order.documentId });
}

async function finalizeCapturedPayment(strapi, order, payment, paymentSignature = '') {
  validateCapturedPayment(payment, {
    paymentId: payment.id,
    orderId: order.razorpayOrderId,
    amount: Number(order.expectedAmountPaise),
    currency: order.paymentCurrency || PAYMENT_CURRENCY,
  });

  let current = await strapi.db.query(STRAPI_ORDER_UID).findOne({ where: { id: order.id } });
  if (['confirmed', 'processing', 'shipped', 'delivered', 'refunded'].includes(current.orderStatus)) {
    if (current.paymentId !== payment.id) throw httpError('Order was confirmed with a different payment', 409);
    await publishOrderDocument(strapi, current);
    return current;
  }

  if (!['pending', 'failed', 'expired', 'payment_review'].includes(current.orderStatus)) {
    throw httpError('Order is not eligible for payment confirmation', 409);
  }

  if (current.orderStatus !== 'pending') {
    try {
      await strapi.db.transaction(async () => {
        await reserveArtworks(strapi, current.orderItems);
        const restored = await strapi.db.query(STRAPI_ORDER_UID).updateMany({
          where: { id: current.id, orderStatus: current.orderStatus },
          data: { orderStatus: 'pending' },
        });
        if (restored.count !== 1) throw httpError('Order state changed during recovery', 409);
      });
      current = await strapi.db.query(STRAPI_ORDER_UID).findOne({ where: { id: current.id } });
    } catch (error) {
      const reviewTransition = await strapi.db.query(STRAPI_ORDER_UID).updateMany({
        where: { id: current.id, orderStatus: current.orderStatus },
        data: {
          orderStatus: 'payment_review',
          paymentId: payment.id,
          gatewayStatus: payment.status,
          paymentVerifiedAt: new Date().toISOString(),
        },
      });
      if (reviewTransition.count !== 1) {
        const latest = await strapi.db.query(STRAPI_ORDER_UID).findOne({ where: { id: current.id } });
        if (latest?.orderStatus === 'confirmed' && latest.paymentId === payment.id) return latest;
        throw httpError('Order state changed during payment review', 409);
      }
      throw httpError('Payment was captured but the artwork requires manual stock review', 409);
    }
  }

  const now = new Date().toISOString();
  const transitioned = await strapi.db.query(STRAPI_ORDER_UID).updateMany({
    where: { id: current.id, orderStatus: 'pending' },
    data: {
      paymentId: payment.id,
      paymentSignature: paymentSignature || current.paymentSignature,
      paymentMethod: payment.method || '',
      gatewayStatus: payment.status,
      paymentVerifiedAt: now,
      orderStatus: 'confirmed',
      orderDate: now,
      emailStatus: current.emailStatus === 'sent' ? 'sent' : 'pending',
    },
  });
  const confirmed = await strapi.db.query(STRAPI_ORDER_UID).findOne({ where: { id: current.id } });
  if (transitioned.count !== 1) {
    if (confirmed.orderStatus === 'confirmed' && confirmed.paymentId === payment.id) return confirmed;
    throw httpError('Order state changed while confirming payment', 409);
  }

  await updateEmailDelivery(strapi, confirmed).catch((error) => {
    strapi.log.error(`[order-email] Confirmation remains queued for ${confirmed.orderNumber}: ${error.message}`);
  });
  const finalized = await strapi.db.query(STRAPI_ORDER_UID).findOne({ where: { id: current.id } });
  await publishOrderDocument(strapi, finalized);
  return finalized;
}

async function failAndReleaseReservation(strapi, order, status = 'failed') {
  return strapi.db.transaction(async () => {
    const transitioned = await strapi.db.query(STRAPI_ORDER_UID).updateMany({
      where: { id: order.id, orderStatus: 'pending' },
      data: { orderStatus: status, gatewayStatus: status },
    });
    if (transitioned.count !== 1) return false;
    await releaseReservedArtworks(strapi, order.orderItems);
    return true;
  });
}

async function expireStaleReservations(strapi, config) {
  const stale = await strapi.db.query(STRAPI_ORDER_UID).findMany({
    where: { orderStatus: 'pending', reservationExpiresAt: { $lt: new Date().toISOString() } },
    limit: 10,
  });
  for (const order of stale) {
    try {
      if (order.razorpayOrderId) {
        const payments = await fetchRazorpayOrderPayments(order.razorpayOrderId, config);
        const { captured, active } = getRazorpayPaymentState(payments?.items);
        if (captured) {
          await finalizeCapturedPayment(strapi, order, captured);
          continue;
        }
        if (active) continue;
      }
      await failAndReleaseReservation(strapi, order, 'expired');
    } catch (error) {
      strapi.log.warn(`[payment-maintenance] Kept reservation ${order.orderNumber}: ${error.message}`);
    }
  }
}

async function retryPendingOrderEmails(strapi) {
  const orders = await strapi.db.query(STRAPI_ORDER_UID).findMany({
    where: {
      orderStatus: 'confirmed',
      emailStatus: { $in: ['pending', 'sending', 'partial', 'failed'] },
    },
    limit: 10,
  });

  for (const order of orders) {
    if (order.emailStatus === 'sending') {
      const attemptedAt = new Date(order.emailAttemptedAt || 0).getTime();
      if (Date.now() - attemptedAt < 10 * 60 * 1000) continue;
      await strapi.db.query(STRAPI_ORDER_UID).updateMany({
        where: { id: order.id, emailStatus: 'sending' },
        data: { emailStatus: 'failed' },
      });
      order.emailStatus = 'failed';
    }

    const delivery = order.emailDelivery && typeof order.emailDelivery === 'object' ? order.emailDelivery : {};
    const attempts = Math.max(
      Number(delivery.artist?.attempts || 0),
      Number(delivery.collector?.attempts || 0)
    );
    if (attempts >= 5) continue;

    await updateEmailDelivery(strapi, order).catch((error) => {
      strapi.log.warn(`[order-email] Retry remains queued for ${order.orderNumber}: ${error.message}`);
    });
  }
}

function getWebhookPayment(payload) {
  return payload?.payload?.payment?.entity || null;
}

async function getOrCreatePaymentEvent(strapi, eventId, eventType, payment) {
  let event = await strapi.db.query(STRAPI_PAYMENT_EVENT_UID).findOne({ where: { eventId } });
  if (event) return event;
  try {
    event = await strapi.db.query(STRAPI_PAYMENT_EVENT_UID).create({
      data: {
        eventId,
        eventType,
        razorpayOrderId: payment?.order_id || '',
        paymentId: payment?.id || '',
        processingStatus: 'received',
      },
    });
  } catch (error) {
    event = await strapi.db.query(STRAPI_PAYMENT_EVENT_UID).findOne({ where: { eventId } });
    if (!event) throw error;
  }
  return event;
}

async function claimPaymentEvent(strapi, event) {
  if (['processed', 'ignored'].includes(event.processingStatus)) return false;
  if (event.processingStatus === 'processing') {
    const updatedAt = new Date(event.updatedAt || 0).getTime();
    if (Date.now() - updatedAt < 2 * 60 * 1000) return false;
  }

  const where: Record<string, any> = { id: event.id, processingStatus: event.processingStatus };
  if (event.processingStatus === 'processing' && event.updatedAt) where.updatedAt = event.updatedAt;
  const claimed = await strapi.db.query(STRAPI_PAYMENT_EVENT_UID).updateMany({
    where,
    data: { processingStatus: 'processing' },
  });
  return claimed.count === 1;
}

async function finishPaymentEvent(strapi, event, processingStatus, error = '') {
  await strapi.db.query(STRAPI_PAYMENT_EVENT_UID).update({
    where: { id: event.id },
    data: {
      processingStatus,
      processedAt: new Date().toISOString(),
      errorMessage: error ? String(error).slice(0, 500) : '',
    },
  });
}

module.exports = createCoreController(STRAPI_ORDER_UID, ({ strapi }) => ({
  async runPaymentMaintenance() {
    const config = getRazorpayConfig();
    await expireStaleReservations(strapi, config);
    await retryPendingOrderEmails(strapi);
  },

  async publicReceipt(ctx) {
    try {
      ctx.set('Cache-Control', 'no-store');
      const orderNumber = String(ctx.params?.orderNumber || '').trim();
      if (!/^ORD-\d{10,20}$/.test(orderNumber)) ctx.throw(400, 'Invalid order number');
      const order = await strapi.db.query(STRAPI_ORDER_UID).findOne({
        where: {
          orderNumber,
          orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] },
          publishedAt: { $notNull: true },
        },
      });
      if (!order) ctx.throw(404, 'Order receipt not found');
      const acceptsHtml = String(ctx.get('accept') || '').toLowerCase().includes('text/html');
      const frontendReceiptUrl = getFrontendReceiptUrl(orderNumber);
      if (acceptsHtml && frontendReceiptUrl) {
        ctx.redirect(frontendReceiptUrl);
        return;
      }
      ctx.send(serializePublicReceipt(order));
    } catch (error) {
      ctx.status = error.status || 400;
      ctx.body = { error: error.message || 'Unable to load order receipt' };
    }
  },

  async createRazorpayOrder(ctx) {
    let pendingOrder;
    try {
      const config = getRazorpayConfig();
      await expireStaleReservations(strapi, config);
      const customer = validateCustomer(ctx.request.body?.customer);
      const { orderItems, total, amountInPaise } = await buildOrderItems(strapi, ctx.request.body?.items);
      const reservationOwnerHash = createReservationOwnerHash(ctx);
      await enforceReservationQuota(strapi, reservationOwnerHash, orderItems.length);
      const orderNumber = makeOrderNumber();
      const reservationToken = createReservationToken();
      const reservationExpiresAt = getReservationExpiry(new Date(), getReservationMinutes()).toISOString();

      pendingOrder = await strapi.db.transaction(async () => {
        const artworkIds = await reserveArtworks(strapi, orderItems);
        return strapi.documents(STRAPI_ORDER_UID).create({
          status: 'published',
          data: {
            orderNumber,
            customerName: `${customer.firstName} ${customer.lastName}`,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            shippingAddress: buildShippingAddress(customer),
            city: customer.city,
            state: customer.state,
            pincode: customer.pincode,
            orderNotes: customer.orderNotes,
            orderItems,
            totalAmount: total,
            expectedAmountPaise: amountInPaise,
            paymentCurrency: PAYMENT_CURRENCY,
            orderStatus: 'pending',
            reservationExpiresAt,
            reservationTokenHash: hashReservationToken(reservationToken),
            reservationOwnerHash,
            emailStatus: 'pending',
            orderDate: new Date().toISOString(),
            artworks: artworkIds,
          },
        });
      });

      const gatewayOrder = await createRazorpayOrder({ amountInPaise, orderNumber }, config);
      pendingOrder = await strapi.documents(STRAPI_ORDER_UID).update({
        documentId: pendingOrder.documentId,
        status: 'published',
        data: { razorpayOrderId: gatewayOrder.id, gatewayStatus: gatewayOrder.status || 'created' },
      });
      ctx.send({
        localOrder: {
          id: pendingOrder.id,
          documentId: pendingOrder.documentId,
          orderNumber: pendingOrder.orderNumber,
          reservationToken,
          reservationExpiresAt,
          total,
          items: orderItems,
        },
        razorpay: {
          keyId: config.keyId,
          orderId: gatewayOrder.id,
          amount: gatewayOrder.amount,
          currency: gatewayOrder.currency,
        },
      });
    } catch (error) {
      if (pendingOrder?.id) {
        await failAndReleaseReservation(strapi, pendingOrder).catch((releaseError) => {
          strapi.log.error(`[payment] Failed to release ${pendingOrder.orderNumber}: ${releaseError.message}`);
        });
      }
      ctx.status = error.status || 400;
      ctx.body = { error: error.message || 'Unable to create order' };
    }
  },

  async verifyPayment(ctx) {
    try {
      const config = getRazorpayConfig();
      const { localOrderDocumentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = ctx.request.body || {};
      if (!localOrderDocumentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        ctx.throw(400, 'Missing payment verification fields');
      }
      if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, config.keySecret)) {
        ctx.throw(400, 'Invalid payment signature');
      }
      const order = await strapi.documents(STRAPI_ORDER_UID).findOne({ documentId: localOrderDocumentId });
      if (!order || order.razorpayOrderId !== razorpayOrderId) ctx.throw(404, 'Order not found');

      const payment = await fetchRazorpayPayment(razorpayPaymentId, config);
      const confirmed = await finalizeCapturedPayment(strapi, order, payment, razorpaySignature);
      ctx.send(serializeOrder(confirmed));
    } catch (error) {
      ctx.status = error.status || 400;
      ctx.body = { error: error.message || 'Unable to verify payment' };
    }
  },

  async releaseReservation(ctx) {
    try {
      const config = getRazorpayConfig();
      const { localOrderDocumentId, reservationToken } = ctx.request.body || {};
      if (!localOrderDocumentId || !reservationToken) ctx.throw(400, 'Missing reservation fields');
      const order = await strapi.documents(STRAPI_ORDER_UID).findOne({ documentId: localOrderDocumentId });
      if (!order || !reservationTokenMatches(reservationToken, order.reservationTokenHash)) {
        ctx.throw(404, 'Reservation not found');
      }
      if (order.orderStatus === 'confirmed') {
        ctx.send({ released: false, orderStatus: 'confirmed' });
        return;
      }
      if (order.orderStatus !== 'pending') {
        ctx.send({ released: false, orderStatus: order.orderStatus });
        return;
      }
      if (order.razorpayOrderId) {
        const payments = await fetchRazorpayOrderPayments(order.razorpayOrderId, config);
        const { captured, active } = getRazorpayPaymentState(payments?.items);
        if (captured) {
          const confirmed = await finalizeCapturedPayment(strapi, order, captured);
          ctx.send({ released: false, orderStatus: confirmed.orderStatus });
          return;
        }
        if (active) {
          ctx.send({ released: false, orderStatus: 'payment_authorized' });
          return;
        }
      }
      const released = await failAndReleaseReservation(strapi, order, 'expired');
      ctx.send({ released, orderStatus: released ? 'expired' : 'unchanged' });
    } catch (error) {
      ctx.status = error.status || 400;
      ctx.body = { error: error.message || 'Unable to release reservation' };
    }
  },

  async razorpayWebhook(ctx) {
    let paymentEvent;
    try {
      const config = getRazorpayConfig({ webhook: true });
      const rawBody = ctx.request.body?.[Symbol.for('unparsedBody')];
      const signature = ctx.get('x-razorpay-signature');
      const eventId = String(ctx.get('x-razorpay-event-id') || '').trim();
      const eventType = String(ctx.request.body?.event || '').trim();
      if (!rawBody || !eventId || !eventType) ctx.throw(400, 'Invalid webhook request');
      if (!/^[A-Za-z0-9_-]{8,200}$/.test(eventId) || eventType.length > 100) {
        ctx.throw(400, 'Invalid webhook metadata');
      }
      if (!verifyRazorpayWebhookSignature(rawBody, signature, config.webhookSecret)) {
        ctx.throw(400, 'Invalid webhook signature');
      }

      const payment = getWebhookPayment(ctx.request.body);
      paymentEvent = await getOrCreatePaymentEvent(strapi, eventId, eventType, payment);
      if (!(await claimPaymentEvent(strapi, paymentEvent))) {
        ctx.send({ received: true, duplicate: true });
        return;
      }

      if (['payment.captured', 'order.paid'].includes(eventType)) {
        if (!payment?.id || !payment?.order_id) throw httpError('Webhook payment details are missing');
        const order = await strapi.db.query(STRAPI_ORDER_UID).findOne({
          where: { razorpayOrderId: payment.order_id },
        });
        if (!order) {
          await finishPaymentEvent(strapi, paymentEvent, 'ignored');
          ctx.send({ received: true, ignored: true });
          return;
        }
        const gatewayPayment = await fetchRazorpayPayment(payment.id, config);
        await finalizeCapturedPayment(strapi, order, gatewayPayment);
      } else if (eventType === 'payment.failed' && payment?.order_id) {
        await strapi.db.query(STRAPI_ORDER_UID).updateMany({
          where: { razorpayOrderId: payment.order_id, orderStatus: 'pending' },
          data: { gatewayStatus: 'failed' },
        });
      } else if (eventType === 'refund.processed') {
        const refund = ctx.request.body?.payload?.refund?.entity;
        if (refund?.payment_id) {
          const order = await strapi.db.query(STRAPI_ORDER_UID).findOne({ where: { paymentId: refund.payment_id } });
          if (order) {
            const gatewayPayment = await fetchRazorpayPayment(refund.payment_id, config);
            await strapi.db.query(STRAPI_ORDER_UID).update({
              where: { id: order.id },
              data: {
                gatewayStatus: gatewayPayment.refund_status || gatewayPayment.status,
                orderStatus: gatewayPayment.refund_status === 'full' ? 'refunded' : order.orderStatus,
              },
            });
          }
        }
      } else {
        await finishPaymentEvent(strapi, paymentEvent, 'ignored');
        ctx.send({ received: true, ignored: true });
        return;
      }

      await finishPaymentEvent(strapi, paymentEvent, 'processed');
      ctx.send({ received: true });
    } catch (error) {
      if (paymentEvent?.id) await finishPaymentEvent(strapi, paymentEvent, 'failed', error.message).catch(() => {});
      ctx.status = error.status || 500;
      ctx.body = { error: error.message || 'Unable to process webhook' };
    }
  },
}));
