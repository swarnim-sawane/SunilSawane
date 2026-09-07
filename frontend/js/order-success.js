const SUCCESS_API_BASE_URL = window.ART_CONFIG?.apiBaseUrl || 'https://growing-approval-51840080fc.strapiapp.com/api';
const successAssetBaseUrl = SUCCESS_API_BASE_URL.replace(/\/api\/?$/, '');

async function initOrderSuccessPage() {
    const urlOrderNumber = getSuccessOrderNumberFromUrl();
    const cachedOrder = readCachedSuccessOrder();

    if (cachedOrder && (!urlOrderNumber || cachedOrder.orderNumber === urlOrderNumber)) {
        displayOrderDetails(cachedOrder);
        return;
    }

    if (urlOrderNumber) {
        try {
            const orderData = await requestPublicOrderReceipt(urlOrderNumber);
            displayOrderDetails(orderData);
            return;
        } catch (error) {
            console.warn('Unable to recover order receipt:', error);
        }
    }

    renderMissingOrderState(urlOrderNumber);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOrderSuccessPage);
} else {
    initOrderSuccessPage();
}

function readCachedSuccessOrder() {
    try {
        return JSON.parse(localStorage.getItem('lastOrder') || 'null');
    } catch (error) {
        return null;
    }
}

function getSuccessOrderNumberFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const orderNumber = (params.get('order') || '').trim();
    return /^ORD-\d{10,20}$/.test(orderNumber) ? orderNumber : '';
}

async function fetchPublicOrderReceipt(orderNumber) {
    const response = await fetch(`${SUCCESS_API_BASE_URL}/orders/receipt/${encodeURIComponent(orderNumber)}`);
    const text = await response.text();
    let payload;

    try {
        payload = text ? JSON.parse(text) : {};
    } catch (error) {
        payload = { error: text };
    }

    if (!response.ok) {
        const message = payload?.error?.message
            || (typeof payload?.error === 'string' ? payload.error : '')
            || payload?.message
            || 'Unable to load order receipt';
        throw new Error(message);
    }

    return payload;
}

function requestPublicOrderReceipt(orderNumber) {
    if (typeof fetch === 'function') {
        return fetchPublicOrderReceipt(orderNumber);
    }

    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('GET', `${SUCCESS_API_BASE_URL}/orders/receipt/${encodeURIComponent(orderNumber)}`);
        request.onload = function () {
            let payload;

            try {
                payload = request.responseText ? JSON.parse(request.responseText) : {};
            } catch (error) {
                payload = { error: request.responseText };
            }

            if (request.status >= 200 && request.status < 300) {
                resolve(payload);
                return;
            }

            const message = payload?.error?.message
                || (typeof payload?.error === 'string' ? payload.error : '')
                || payload?.message
                || 'Unable to load order receipt';
            reject(new Error(message));
        };
        request.onerror = function () {
            reject(new Error('Unable to reach order receipt service'));
        };
        request.send();
    });
}

function displayOrderDetails(order) {
    const total = Number(order.total) || 0;
    const customer = order.customer || {};
    const customerName = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
    const isPublicReceipt = order.publicReceipt === true;
    const orderDateValue = order.orderDate ? new Date(order.orderDate) : new Date();
    const orderDate = Number.isNaN(orderDateValue.getTime()) ? '-' : orderDateValue.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const orderStatus = order.orderStatus === 'confirmed' ? 'Confirmed' : (order.orderStatus || 'Payment received');
    const receiptRows = [
        buildSuccessMetaList('Order number', order.orderNumber),
        buildSuccessMetaList('Payment status', orderStatus),
    ];

    if (!isPublicReceipt && order.paymentId) {
        receiptRows.push(buildSuccessMetaList('Payment id', order.paymentId));
    }

    receiptRows.push(
        buildSuccessMetaList('Order date', orderDate),
        buildSuccessMetaList('Order total', successFormatINR(total), 'is-total')
    );

    $('#order-info').empty().append(
        $('<dl>').addClass('success-meta-list').append(receiptRows),
        buildSuccessContactNote(customer, isPublicReceipt)
    );

    renderSuccessShippingInfo(customer, customerName, isPublicReceipt);

    renderSuccessArtworkCards(order.items || [], total);
}

function buildSuccessContactNote(customer, isPublicReceipt) {
    if (isPublicReceipt) {
        return $('<p>').addClass('success-contact-note success-privacy-note').text(
            'Receipt recovered from the confirmed order record. Private delivery details remain securely with the artist.'
        );
    }

    return $('<p>').addClass('success-contact-note').append(
        document.createTextNode('A confirmation has been recorded for '),
        $('<strong>').text(customer.email || 'the collector'),
        document.createTextNode('.')
    );
}

function renderSuccessShippingInfo(customer, customerName, isPublicReceipt) {
    const $shipping = $('#shipping-info').empty();

    $shipping.append($('<p>').addClass('success-customer-name').text(customerName || 'Collector'));

    if (isPublicReceipt) {
        const location = [customer.city, customer.state, customer.pincode].filter(Boolean).join(', ');
        $shipping.append(
            $('<p>').addClass('success-address-line').text(location || 'Delivery details recorded with order.'),
            $('<p>').addClass('success-contact-line success-privacy-note').text(
                'For privacy, the full address is shown only immediately after checkout in the original browser session.'
            )
        );
        return;
    }

    $shipping.append(
        $('<p>').addClass('success-address-line').text(customer.shippingAddress || customer.address || ''),
        $('<p>').addClass('success-contact-line').append(
            $('<strong>').text('Email'),
            document.createTextNode(` ${customer.email || 'Not provided'}`)
        ),
        $('<p>').addClass('success-contact-line').append(
            $('<strong>').text('Phone'),
            document.createTextNode(` ${customer.phone || 'Not provided'}`)
        )
    );
}

function buildSuccessMetaList(label, value, className) {
    return $('<div>')
        .addClass(`success-meta-row ${className || ''}`.trim())
        .append(
            $('<dt>').text(label),
            $('<dd>').text(value || '-')
        );
}

function renderSuccessArtworkCards(items, total) {
    const $list = $('#items-info').empty();

    if (!items.length) {
        $list.append($('<p>').addClass('success-empty-note').text('Artwork details are not available for this order.'));
        return;
    }

    items.forEach(item => {
        const title = item.title || 'Untitled';
        const quantity = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const image = getSuccessArtworkImage(item);
        const href = item.documentId
            ? `artwork-detail.html?id=${encodeURIComponent(item.documentId)}`
            : 'gallery.html';

        const $card = $('<article>').addClass('success-artwork-card').append(
            $('<a>')
                .addClass('success-artwork-image-link')
                .attr({ href, 'aria-label': `View ${title}` })
                .append(
                    $('<img>').attr({
                        src: image,
                        alt: title
                    })
                ),
            $('<div>').addClass('success-artwork-copy').append(
                $('<span>').addClass('success-status-pill').text('Acquisition secured'),
                $('<h3>').append($('<a>').attr('href', href).text(title)),
                $('<p>').addClass('success-artwork-meta').text(quantity === 1 ? 'One original artwork' : `${quantity} original artworks`),
                $('<p>').addClass('success-artwork-price').text(successFormatINR(price * quantity))
            )
        );

        $list.append($card);
    });

    $list.append(
        $('<div>').addClass('success-artwork-total').append(
            $('<span>').text('Paid total'),
            $('<strong>').text(successFormatINR(total))
        )
    );
}

function getSuccessArtworkImage(item) {
    const image = item.image || item.Image || '';
    const fallback = window.domUtils?.PLACEHOLDER_IMAGE || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e0e0e0" width="400" height="300"/%3E%3C/svg%3E';

    if (!image) return fallback;
    if (image.startsWith('http') || image.startsWith('data:image/')) return image;
    return window.domUtils?.safeUrl(`${successAssetBaseUrl}${image}`, fallback) || fallback;
}

function successFormatINR(value) {
    return window.domUtils?.formatINR
        ? window.domUtils.formatINR(value)
        : `Rs. ${(Number(value) || 0).toLocaleString('en-IN')}`;
}

function renderMissingOrderState(orderNumber) {
    $('#order-info').empty().append(
        $('<p>').addClass('success-empty-note').text(
            orderNumber
                ? `We could not recover order details for ${orderNumber}.`
                : 'Order details were not found in this browser.'
        )
    );
    $('#shipping-info').empty().append(
        $('<p>').addClass('success-empty-note').text('Please contact the artist with your payment reference if you need support.')
    );
    $('#items-info').empty().append(
        $('<p>').addClass('success-empty-note').text('No acquired artwork is available to display.')
    );
}
