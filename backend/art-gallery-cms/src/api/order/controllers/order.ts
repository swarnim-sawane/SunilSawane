'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const {
  buildShippingAddress,
  normalizeCartItems,
  validateCustomer,
  verifyRazorpaySignature,
} = require('../utils/payment-utils');
const { notifyOrderConfirmed } = require('../utils/order-email');

const STRAPI_ARTWORK_UID = 'api::artwork.artwork';
const STRAPI_ORDER_UID = 'api::order.order';

function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw Object.assign(new Error('Payment gateway is not configured'), { status: 500 });
  }

  return { keyId, keySecret };
}

function toMoney(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Artwork has invalid price');
  }
  return amount;
}

async function fetchArtwork(strapi, item) {
  const identityWhere = item.documentId ? { documentId: item.documentId } : { id: item.id };
  const where = {
    ...identityWhere,
    publishedAt: {
      $notNull: true,
    },
  };
  const artwork = await strapi.db.query(STRAPI_ARTWORK_UID).findOne({
    where,
    populate: { images: true, category: true },
  });

  if (!artwork || artwork.isAvailable === false) {
    throw new Error('Artwork is not available');
  }

  return artwork;
}

async function buildOrderItems(strapi, requestedItems) {
  const normalized = normalizeCartItems(requestedItems);
  const orderItems = [];
  let total = 0;

  for (const item of normalized) {
    const artwork = await fetchArtwork(strapi, item);
    const price = toMoney(artwork.price);
    const quantity = item.quantity;
    const image = Array.isArray(artwork.images) && artwork.images[0]?.url ? artwork.images[0].url : '';

    orderItems.push({
      id: artwork.id,
      documentId: artwork.documentId,
      title: artwork.title,
      price,
      quantity,
      image,
      slug: artwork.slug,
      dimensions: artwork.dimensions,
      medium: artwork.medium,
      yearCreated: artwork.yearCreated,
      framingStatus: artwork.framingStatus,
      shippingNote: artwork.shippingNote,
      certificateNote: artwork.certificateNote,
    });
    total += price * quantity;
  }

  return {
    orderItems,
    total,
    amountInPaise: Math.round(total * 100),
  };
}

function getOrderArtworkIds(orderItems) {
  return [...new Set((orderItems || []).map((item) => Number(item.id)).filter(Number.isInteger))];
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
    customer: {
      name: order.customerName,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
    },
    items: order.orderItems,
    total: Number(order.totalAmount || 0),
    publicReceipt: true,
  };
}

async function markPurchasedArtworksUnavailable(strapi, orderItems) {
  const artworkIds = getOrderArtworkIds(orderItems);

  for (const artworkId of artworkIds) {
    const updated = await strapi.db.query(STRAPI_ARTWORK_UID).updateMany({
      where: {
        id: artworkId,
        isAvailable: {
          $ne: false,
        },
      },
      data: {
        isAvailable: false,
      },
    });

    if (updated.count !== 1) {
      throw Object.assign(new Error('One or more artworks are no longer available'), { status: 409 });
    }
  }

  return artworkIds;
}

async function createRazorpayOrder({ amountInPaise, orderNumber, localOrderNumber }, { keyId, keySecret }) {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderNumber,
      payment_capture: 1,
      notes: {
        orderNumber: localOrderNumber,
      },
    }),
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    payload = { error: text };
  }

  if (!response.ok) {
    const message = payload?.error?.description || payload?.error || 'Unable to create Razorpay order';
    throw Object.assign(new Error(message), { status: 502 });
  }

  return payload;
}

module.exports = createCoreController(STRAPI_ORDER_UID, ({ strapi }) => ({
  async publicReceipt(ctx) {
    try {
      const orderNumber = String(ctx.params?.orderNumber || '').trim();

      if (!/^ORD-\d{10,20}$/.test(orderNumber)) {
        ctx.throw(400, 'Invalid order number');
      }

      const order = await strapi.db.query(STRAPI_ORDER_UID).findOne({
        where: {
          orderNumber,
          orderStatus: 'confirmed',
          publishedAt: {
            $notNull: true,
          },
        },
      });

      if (!order) {
        ctx.throw(404, 'Order receipt not found');
      }

      ctx.send(serializePublicReceipt(order));
    } catch (error) {
      ctx.status = error.status || 400;
      ctx.body = { error: error.message || 'Unable to load order receipt' };
    }
  },

  async createRazorpayOrder(ctx) {
    try {
      const { keyId, keySecret } = getRazorpayConfig();
      const customer = validateCustomer(ctx.request.body?.customer);
      const { orderItems, total, amountInPaise } = await buildOrderItems(strapi, ctx.request.body?.items);
      const orderNumber = `ORD-${Date.now()}`;
      const gatewayOrder = await createRazorpayOrder(
        {
          amountInPaise,
          orderNumber,
          localOrderNumber: orderNumber,
        },
        { keyId, keySecret }
      );

      const order = await strapi.documents(STRAPI_ORDER_UID).create({
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
          orderStatus: 'pending',
          razorpayOrderId: gatewayOrder.id,
          orderDate: new Date().toISOString(),
        },
      });

      ctx.send({
        localOrder: {
          id: order.id,
          documentId: order.documentId,
          orderNumber: order.orderNumber,
          total,
          items: orderItems,
        },
        razorpay: {
          keyId,
          orderId: gatewayOrder.id,
          amount: gatewayOrder.amount,
          currency: gatewayOrder.currency,
        },
      });
    } catch (error) {
      ctx.status = error.status || 400;
      ctx.body = { error: error.message || 'Unable to create order' };
    }
  },

  async verifyPayment(ctx) {
    try {
      const { keySecret } = getRazorpayConfig();
      const {
        localOrderDocumentId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      } = ctx.request.body || {};

      if (!localOrderDocumentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        ctx.throw(400, 'Missing payment verification fields');
      }

      const isValid = verifyRazorpaySignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        keySecret
      );

      if (!isValid) {
        ctx.throw(400, 'Invalid payment signature');
      }

      const existingOrder = await strapi.documents(STRAPI_ORDER_UID).findOne({
        documentId: localOrderDocumentId,
      });

      if (!existingOrder || existingOrder.razorpayOrderId !== razorpayOrderId) {
        ctx.throw(404, 'Order not found');
      }

      if (existingOrder.orderStatus === 'confirmed') {
        if (existingOrder.paymentId === razorpayPaymentId) {
          ctx.send(serializeOrder(existingOrder));
          return;
        }

        ctx.throw(409, 'Order has already been confirmed with a different payment');
      }

      if (existingOrder.orderStatus !== 'pending') {
        ctx.throw(409, 'Order is not awaiting payment');
      }

      const updatedOrder = await strapi.db.transaction(async () => {
        const artworkIds = await markPurchasedArtworksUnavailable(strapi, existingOrder.orderItems);

        return strapi.documents(STRAPI_ORDER_UID).update({
          documentId: localOrderDocumentId,
          status: 'published',
          data: {
            paymentId: razorpayPaymentId,
            paymentSignature: razorpaySignature,
            orderStatus: 'confirmed',
            orderDate: new Date().toISOString(),
            artworks: artworkIds,
          },
        });
      });

      await notifyOrderConfirmed(strapi, updatedOrder).catch((error) => {
        strapi.log?.error?.(`[order-email] Unable to send confirmation for ${updatedOrder.orderNumber}: ${error.message}`);
      });

      ctx.send(serializeOrder(updatedOrder));
    } catch (error) {
      ctx.status = error.status || 400;
      ctx.body = { error: error.message || 'Unable to verify payment' };
    }
  },
}));
