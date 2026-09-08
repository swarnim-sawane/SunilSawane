const crypto = require('node:crypto');

const MAX_CART_ITEMS = 3;

const ORDER_TRANSITIONS = {
  pending: new Set(['confirmed', 'failed', 'expired', 'payment_review']),
  payment_review: new Set(['confirmed', 'failed', 'refunded']),
  confirmed: new Set(['processing', 'refunded']),
  processing: new Set(['shipped', 'refunded']),
  shipped: new Set(['delivered', 'refunded']),
  delivered: new Set([]),
  failed: new Set([]),
  expired: new Set(['payment_review']),
  refunded: new Set([]),
};

function cleanString(value) {
  return String(value || '').trim();
}

function normalizeCartItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cart is empty');
  }

  if (items.length > MAX_CART_ITEMS) {
    throw new Error('Cart contains too many artworks');
  }

  const seenItems = new Set();

  return items.map((item) => {
    const normalized: Record<string, any> = {};
    const quantity = Number.parseInt(item.quantity, 10);

    if (quantity !== 1) {
      throw new Error('Each artwork is one-of-one and quantity must be 1');
    }

    if (item.documentId) {
      normalized.documentId = cleanString(item.documentId);
    } else if (item.id !== undefined && item.id !== null) {
      const id = Number.parseInt(item.id, 10);
      if (!Number.isInteger(id) || id < 1) {
        throw new Error('Invalid artwork id');
      }
      normalized.id = id;
    } else {
      throw new Error('Cart item is missing artwork id');
    }

    const itemKey = normalized.documentId || normalized.id;
    if (seenItems.has(itemKey)) {
      throw new Error('Duplicate artwork in cart');
    }
    seenItems.add(itemKey);

    normalized.quantity = quantity;
    return normalized;
  });
}

function validateCustomer(customer) {
  const normalized = {
    firstName: cleanString(customer?.firstName),
    lastName: cleanString(customer?.lastName),
    email: cleanString(customer?.email).toLowerCase(),
    phone: cleanString(customer?.phone),
    address: cleanString(customer?.address),
    city: cleanString(customer?.city),
    state: cleanString(customer?.state),
    pincode: cleanString(customer?.pincode),
    country: cleanString(customer?.country || 'India'),
    orderNotes: cleanString(customer?.orderNotes),
  };

  if (!/^[A-Za-z\s]{2,50}$/.test(normalized.firstName)) {
    throw new Error('Invalid first name');
  }
  if (!/^[A-Za-z\s]{2,50}$/.test(normalized.lastName)) {
    throw new Error('Invalid last name');
  }
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized.email)) {
    throw new Error('Invalid email');
  }
  if (!/^\+?[0-9]{10,13}$/.test(normalized.phone)) {
    throw new Error('Invalid phone');
  }
  if (normalized.address.length < 5 || normalized.address.length > 250) {
    throw new Error('Invalid address');
  }
  if (!/^[A-Za-z\s]{2,50}$/.test(normalized.city)) {
    throw new Error('Invalid city');
  }
  if (!/^[A-Za-z\s]{2,50}$/.test(normalized.state)) {
    throw new Error('Invalid state');
  }
  if (!/^[0-9]{6}$/.test(normalized.pincode)) {
    throw new Error('Invalid pincode');
  }
  if (normalized.country.length < 2 || normalized.country.length > 60) {
    throw new Error('Invalid country');
  }
  if (normalized.orderNotes.length > 1000) {
    throw new Error('Order notes are too long');
  }

  return normalized;
}

function buildShippingAddress(customer) {
  return `${customer.address}, ${customer.city}, ${customer.state} - ${customer.pincode}, ${customer.country}`;
}

function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const actual = cleanString(signature);

  if (actual.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

function verifyRazorpayWebhookSignature(rawBody, signature, secret) {
  if ((!Buffer.isBuffer(rawBody) && typeof rawBody !== 'string') || !cleanString(secret)) {
    return false;
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const actual = cleanString(signature);

  if (actual.length !== expected.length || !/^[a-f0-9]+$/i.test(actual)) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

function validateCapturedPayment(payment, expected) {
  if (!payment || typeof payment !== 'object') {
    throw new Error('Razorpay payment details are missing');
  }
  if (payment.id !== expected.paymentId) {
    throw new Error('Razorpay payment id does not match');
  }
  if (payment.order_id !== expected.orderId) {
    throw new Error('Razorpay order does not match');
  }
  if (!Number.isInteger(payment.amount) || payment.amount !== expected.amount) {
    throw new Error('Razorpay payment amount does not match');
  }
  if (cleanString(payment.currency).toUpperCase() !== cleanString(expected.currency).toUpperCase()) {
    throw new Error('Razorpay payment currency does not match');
  }
  if (payment.status !== 'captured' || payment.captured !== true) {
    throw new Error('Razorpay payment has not been captured');
  }

  return true;
}

function isOrderTransitionAllowed(from, to) {
  const current = cleanString(from);
  const next = cleanString(to);
  return current === next || Boolean(ORDER_TRANSITIONS[current]?.has(next));
}

function getReservationExpiry(now = new Date(), minutes = 20) {
  const duration = Number(minutes);
  const start = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(duration) || duration < 1 || duration > 60 || Number.isNaN(start.getTime())) {
    throw new Error('Invalid reservation duration');
  }

  return new Date(start.getTime() + Math.round(duration * 60_000));
}

function getRazorpayPaymentState(items) {
  const payments = Array.isArray(items) ? items : [];
  const captured = payments.find((payment) => payment?.status === 'captured' && payment?.captured === true) || null;
  const active = captured
    || payments.find((payment) => payment?.status === 'authorized')
    || null;

  return { captured, active };
}

module.exports = {
  buildShippingAddress,
  getReservationExpiry,
  getRazorpayPaymentState,
  isOrderTransitionAllowed,
  normalizeCartItems,
  validateCapturedPayment,
  validateCustomer,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
};

export {};
