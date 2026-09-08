const CHECKOUT_API_BASE_URL = window.ART_CONFIG?.apiBaseUrl || 'https://growing-approval-51840080fc.strapiapp.com/api';
const paymentButtonSelector = '#payment-button';
const checkoutArrivalFlowTransitionKey = 'sunilsawaneCheckoutFlowTransition';
const checkoutArrivalFlowScrollKey = 'sunilsawaneCheckoutFlowScroll';

$(document).ready(function () {
    console.log('Checkout page loaded');

    initCheckoutPage();
    $(paymentButtonSelector).on('click', proceedToPayment);
});

async function initCheckoutPage() {
    if (typeof cart.refreshAvailability === 'function') {
        await cart.refreshAvailability();
    }

    if (cart.items.length === 0) {
        const emptyMessage = $('<p>').addClass('checkout-empty-note');
        emptyMessage.text('Your cart is empty. ');
        emptyMessage.append($('<a>').attr('href', 'shop.html').text('Go to Shop'));
        $('#checkout-items').empty().append(emptyMessage);
        $(paymentButtonSelector).prop('disabled', true);
    } else {
        loadCheckoutSummary();
        if (typeof cartHasUnavailableItems === 'function' && cartHasUnavailableItems()) {
            const unavailableMessage = $('<p>')
                .addClass('checkout-empty-note checkout-availability-note')
                .text('Please return to cart and remove collected works before payment.');
            $('#checkout-items').append(unavailableMessage);
            $(paymentButtonSelector).prop('disabled', true).text('Review cart availability');
        }
    }
}

function formatCurrency(amount) {
    return Number(amount || 0).toLocaleString('en-IN');
}

function loadCheckoutSummary() {
    const items = cart.items;
    const orderItems = $('<div>').addClass('checkout-order-items');

    items.forEach(item => {
        const row = $('<div>').addClass('checkout-order-item');
        const detail = $('<div>').addClass('checkout-order-detail');

        detail.append($('<strong>').addClass('checkout-order-title').text(item.title || 'Artwork'));
        detail.append($('<small>').addClass('checkout-order-meta').text(`Qty: ${item.quantity}`));
        row.append(detail);
        row.append($('<div>').addClass('checkout-order-price').text(`\u20B9${formatCurrency((item.price || 0) * item.quantity)}`));
        orderItems.append(row);
    });

    $('#checkout-items').empty().append(orderItems);

    const total = cart.getTotal();
    $('#checkout-subtotal').text(formatCurrency(total));
    $('#checkout-total').text(formatCurrency(total));
}

function getCustomerData() {
    return {
        firstName: $('input[name="fname"]').val(),
        lastName: $('input[name="lname"]').val(),
        email: $('input[name="email"]').val(),
        phone: $('input[name="phone"]').val(),
        address: $('input[name="address"]').val(),
        city: $('input[name="city"]').val(),
        state: $('input[name="state"]').val(),
        pincode: $('input[name="zipcode"]').val(),
        country: $('select[name="country"]').val(),
        orderNotes: $('textarea[name="order-notes"]').val()
    };
}

function setPaymentButtonLoading(isLoading, label = 'Place Order & Pay') {
    const button = $(paymentButtonSelector);
    if (isLoading) {
        button.html('<span class="spinner-border spinner-border-sm me-2"></span>Processing...').prop('disabled', true);
    } else {
        button.text(label).prop('disabled', false);
    }
}

async function postCheckout(path, payload) {
    const endpoint = `${CHECKOUT_API_BASE_URL}${path}`;
    let response;

    try {
        response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
    } catch (error) {
        throw new Error(`Could not reach checkout backend at ${endpoint}. Keep npm run dev running, then reload this page. ${error.message}`);
    }

    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch (error) {
        data = { error: text };
    }

    if (!response.ok) {
        const errorMessage = data?.error?.message
            || data?.error?.description
            || (typeof data?.error === 'string' ? data.error : '')
            || data?.message
            || 'Checkout request failed';

        throw new Error(errorMessage);
    }

    return data;
}

function proceedToPayment() {
    const form = document.getElementById('billing-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (cart.items.length === 0) {
        alert('Your cart is empty.');
        return;
    }

    if (typeof cartHasUnavailableItems === 'function' && cartHasUnavailableItems()) {
        alert('Please return to cart and remove collected works before payment.');
        return;
    }

    initiateRazorpay(getCustomerData());
}

async function initiateRazorpay(customer) {
    let checkoutOrder;
    let paymentCompletionStarted = false;

    try {
        setPaymentButtonLoading(true);

        checkoutOrder = await postCheckout('/orders/create-razorpay-order', {
            customer,
            items: cart.items,
        });

        const options = {
            key: checkoutOrder.razorpay.keyId,
            amount: checkoutOrder.razorpay.amount,
            currency: checkoutOrder.razorpay.currency,
            order_id: checkoutOrder.razorpay.orderId,
            name: 'Sunil Sawane Art',
            description: 'Artwork Purchase',
            handler: async function (response) {
                paymentCompletionStarted = true;
                await verifyPayment(checkoutOrder.localOrder, response);
            },
            prefill: {
                name: `${customer.firstName} ${customer.lastName}`,
                email: customer.email,
                contact: customer.phone
            },
            modal: {
                ondismiss: async function () {
                    if (!paymentCompletionStarted) {
                        await releaseCheckoutReservation(checkoutOrder.localOrder);
                    }
                    setPaymentButtonLoading(false);
                }
            },
            theme: { color: '#333333' }
        };

        const razorpay = new Razorpay(options);
        razorpay.on('payment.failed', function () {
            setPaymentButtonLoading(false, 'Payment attempt failed. Try again');
        });
        razorpay.open();
    } catch (error) {
        if (checkoutOrder?.localOrder && !paymentCompletionStarted) {
            await releaseCheckoutReservation(checkoutOrder.localOrder);
        }
        console.error('Checkout initialization failed:', error);
        alert(`Unable to start payment: ${error.message}`);
        setPaymentButtonLoading(false);
    }
}

async function releaseCheckoutReservation(localOrder) {
    if (!localOrder?.documentId || !localOrder?.reservationToken) {
        return;
    }

    try {
        await postCheckout('/orders/release-reservation', {
            localOrderDocumentId: localOrder.documentId,
            reservationToken: localOrder.reservationToken,
        });
    } catch (error) {
        console.warn('Reservation release will be reconciled by the server:', error);
    }
}

async function verifyPayment(localOrder, razorpayResponse) {
    try {
        const verifiedOrder = await postCheckout('/orders/verify-payment', {
            localOrderDocumentId: localOrder.documentId,
            razorpayOrderId: razorpayResponse.razorpay_order_id,
            razorpayPaymentId: razorpayResponse.razorpay_payment_id,
            razorpaySignature: razorpayResponse.razorpay_signature,
        });

        localStorage.setItem('lastOrder', JSON.stringify({
            orderNumber: verifiedOrder.orderNumber,
            orderStatus: verifiedOrder.orderStatus,
            paymentId: verifiedOrder.paymentId,
            orderDate: verifiedOrder.orderDate,
            customer: verifiedOrder.customer,
            items: verifiedOrder.items,
            total: verifiedOrder.total
        }));

        cart.clear();
        window.location.href = `order-success.html?order=${encodeURIComponent(verifiedOrder.orderNumber)}`;
    } catch (error) {
        console.error('Payment verification failed:', error);
        alert(`Payment could not be verified. Please contact support. ${error.message}`);
        setPaymentButtonLoading(false);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    animateCheckoutArrivalFromCart();

    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/[^\d+]/g, '');
            if (value.length > 0 && !value.startsWith('+')) {
                value = '+91' + value;
            }
            if (value.length > 13) {
                value = value.substring(0, 13);
            }
            e.target.value = value;
        });
    }

    const pincodeInput = document.getElementById('zipcode');
    if (pincodeInput) {
        pincodeInput.addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/[^\d]/g, '').substring(0, 6);
        });
    }

    ['fname', 'lname', 'city', 'state'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function (e) {
                e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, '');
            });
        }
    });

    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function (e) {
            const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
            e.target.classList.toggle('is-invalid', Boolean(e.target.value && !emailPattern.test(e.target.value)));
        });
    }

    const form = document.getElementById('billing-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            proceedToPayment();
        });
    }
});

function animateCheckoutArrivalFromCart() {
    let shouldAnimate = false;
    let shouldAlignRail = false;

    try {
        shouldAnimate = sessionStorage.getItem(checkoutArrivalFlowTransitionKey) === 'cart-to-checkout';
        shouldAlignRail = sessionStorage.getItem(checkoutArrivalFlowScrollKey) === 'rail';
        sessionStorage.removeItem(checkoutArrivalFlowTransitionKey);
        sessionStorage.removeItem(checkoutArrivalFlowScrollKey);
    } catch (error) {
        shouldAnimate = false;
        shouldAlignRail = false;
    }

    if (!shouldAnimate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    const progress = document.querySelector('.checkout-progress-row');
    const steps = progress ? Array.from(progress.querySelectorAll('span')) : [];
    const shell = document.querySelector('.checkout-shell');

    if (steps.length < 2) {
        return;
    }

    if (shouldAlignRail && shell) {
        const headerOffset = 104;
        const targetTop = shell.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo(0, Math.max(0, targetTop));
    }

    document.body.classList.add('checkout-flow-arriving');
    progress.classList.add('is-arriving-from-cart');
    steps.forEach((step, index) => {
        step.classList.toggle('is-current', index === 0);
        step.classList.toggle('is-complete', false);
    });

    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            progress.classList.add('is-advancing-to-details');
        });
    });

    window.setTimeout(() => {
        steps.forEach((step, index) => {
            step.classList.toggle('is-current', index === 1);
            step.classList.toggle('is-complete', index === 0);
        });
    }, 520);

    window.setTimeout(() => {
        progress.classList.remove('is-arriving-from-cart', 'is-advancing-to-details');
        document.body.classList.remove('checkout-flow-arriving');
    }, 840);
}
