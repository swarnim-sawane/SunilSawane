const crypto = require('node:crypto');

const MAX_CART_QUANTITY = 10;

function cleanString(value) {
  return String(value || '').trim();
}

function normalizeCartItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cart is empty');
  }

  const seenItems = new Set();

  return items.map((item) => {
    const normalized: Record<string, any> = {};
    const quantity = Number.parseInt(item.quantity, 10);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_CART_QUANTITY) {
      throw new Error('Invalid quantity');
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

module.exports = {
  buildShippingAddress,
  normalizeCartItems,
  validateCustomer,
  verifyRazorpaySignature,
};

export {};
