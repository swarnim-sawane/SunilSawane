
const RAZORPAY_KEY_ID = 'rzp_test_RF4D0IMNMK7ce7';
const STRAPI_URL = 'https://growing-approval-51840080fc.strapiapp.com';

async function sendOrderConfirmation(billing, items, total, paymentId) {
    try {
        const response = await fetch(`${CONFIG.api.baseUrl}/orders/sendConfirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: billing.email,
                name: `${billing.fname} ${billing.lname}`,
                orderId: paymentId,
                items: items,
                total: total
            })
        });

        return response.ok;
    } catch (error) {
        console.error('Email error:', error);
        return false;
    }
}


$(document).ready(function () {
    console.log('Checkout page loaded');

    if (cart.items.length === 0) {
        $('#checkout-items').html('<p class="text-danger">Your cart is empty. <a href="shop.html">Go to Shop</a></p>');
        $('button[onclick="proceedToPayment()"]').prop('disabled', true);
    } else {
        loadCheckoutSummary();
    }
});

function loadCheckoutSummary() {
    const items = cart.items;
    let html = '<div class="order-items">';

    items.forEach(item => {
        html += `
        <div class="d-flex justify-content-between border-bottom pb-2 mb-2">
          <div>
            <strong>${item.title}</strong>
            <small class="text-muted d-block">Qty: ${item.quantity}</small>
          </div>
          <div>₹${(item.price * item.quantity).toLocaleString()}</div>
        </div>
      `;
    });

    html += '</div>';
    $('#checkout-items').html(html);

    const total = cart.getTotal();
    $('#checkout-subtotal').text(total.toLocaleString());
    $('#checkout-total').text(total.toLocaleString());
}

function proceedToPayment() {
    const form = document.getElementById('billing-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const customerData = {
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

    initiateRazorpay(customerData);
}

function initiateRazorpay(customer) {
    const total = cart.getTotal();

    const options = {
        key: RAZORPAY_KEY_ID,
        amount: total * 100,
        currency: 'INR',
        name: 'Sunil Sawane Art',
        description: 'Artwork Purchase',
        handler: function (response) {
            // Show loading
            $('button[onclick="proceedToPayment()"]').html('<span class="spinner-border spinner-border-sm me-2"></span>Processing...').prop('disabled', true);

            // Save order to Strapi
            saveOrderToStrapi(response.razorpay_payment_id, customer);
        },
        prefill: {
            name: customer.firstName + ' ' + customer.lastName,
            email: customer.email,
            contact: customer.phone
        },
        theme: { color: '#333333' }
    };

    new Razorpay(options).open();
}

async function saveOrderToStrapi(paymentId, customer) {
    try {
        const orderNumber = 'ORD-' + Date.now();

        console.log('=== Starting Order Save ===');
        console.log('Order number:', orderNumber);
        console.log('Payment ID:', paymentId);
        console.log('Customer data:', customer);
        console.log('Cart items:', cart.items);
        console.log('Total:', cart.getTotal());

        const orderData = {
            data: {
                orderNumber: orderNumber,
                paymentId: paymentId,
                customerName: `${customer.firstName} ${customer.lastName}`,
                customerEmail: customer.email,
                customerPhone: customer.phone,

                // Simple string address
                shippingAddress: `${customer.address}, ${customer.city}, ${customer.state} - ${customer.pincode}, ${customer.country}`,

                city: customer.city,
                state: customer.state,
                pincode: customer.pincode,
                orderItems: cart.items,
                totalAmount: cart.getTotal(),
                orderStatus: 'confirmed',
                orderDate: new Date().toISOString()
            }
        };




        console.log('Order data to send:', JSON.stringify(orderData, null, 2));
        console.log('Sending to:', `${STRAPI_URL}/api/orders`);

        // Save order to Strapi
        const response = await fetch(`${STRAPI_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        const responseText = await response.text();
        console.log('Response text:', responseText);

        if (!response.ok) {
            console.error('Strapi error response:', responseText);
            throw new Error('Failed to save order: ' + response.status + ' - ' + responseText);
        }

        const result = JSON.parse(responseText);
        console.log('Order saved successfully:', result);

        // Save to localStorage for success page
        localStorage.setItem('lastOrder', JSON.stringify({
            orderNumber: orderNumber,
            paymentId: paymentId,
            customer: customer,
            items: cart.items,
            total: cart.getTotal()
        }));

        console.log('Saved to localStorage');

        // Clear cart
        cart.clear();
        console.log('Cart cleared');

        // Redirect to success page
        console.log('Redirecting to success page...');
        window.location.href = `order-success.html?order=${orderNumber}`;

    } catch (error) {
        console.error('=== Error in saveOrderToStrapi ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error:', error);

        // Still save to localStorage even if Strapi fails
        const fallbackOrderNumber = 'ORD-' + Date.now();
        localStorage.setItem('lastOrder', JSON.stringify({
            orderNumber: fallbackOrderNumber,
            paymentId: paymentId,
            customer: customer,
            items: cart.items,
            total: cart.getTotal()
        }));

        // Show error but still clear cart and redirect
        alert('Order was paid successfully! However, there was an issue saving to database. Your payment ID is: ' + paymentId + '. Please contact support. Error: ' + error.message);

        cart.clear();
        window.location.href = `order-success.html?order=${fallbackOrderNumber}`;
    }
}



async function sendOrderConfirmationEmail(orderNumber, customer, items, total) {
    try {
        // Generate order items HTML
        let itemsHtml = '';
        items.forEach(item => {
            itemsHtml += `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toLocaleString()}</td>
          </tr>
        `;
        });

        const emailData = {
            to: customer.email,
            subject: `Order Confirmation - ${orderNumber}`,
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #333; color: white; padding: 20px; text-align: center;">
              <h1>Thank You for Your Order!</h1>
            </div>
            
            <div style="padding: 20px;">
              <p>Dear ${customer.firstName},</p>
              <p>Your order has been confirmed and will be processed shortly.</p>
              
              <div style="background: #f8f9fa; padding: 15px; margin: 20px 0;">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> ${orderNumber}</p>
                <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <h3>Items Ordered:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8f9fa;">
                    <th style="padding: 10px; text-align: left;">Item</th>
                    <th style="padding: 10px; text-align: center;">Quantity</th>
                    <th style="padding: 10px; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr>
                    <td colspan="2" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
                    <td style="padding: 10px; text-align: right;"><strong>₹${total.toLocaleString()}</strong></td>
                  </tr>
                </tbody>
              </table>
              
              <div style="background: #f8f9fa; padding: 15px; margin: 20px 0;">
                <h3>Shipping Address</h3>
                <p>${customer.address}<br>
                ${customer.city}, ${customer.state} - ${customer.pincode}</p>
              </div>
              
              <p>If you have any questions, please contact us at contact@sunilsawaneart.com</p>
              
              <p>Best regards,<br>Sunil Sawane Art Team</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
              <p>© 2025 Sunil Sawane Art. All rights reserved.</p>
            </div>
          </div>
        `
        };

        await fetch(`${STRAPI_URL}/api/email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData)
        });

        console.log('Confirmation email sent');

    } catch (error) {
        console.error('Error sending email:', error);
        // Don't fail the order if email fails
    }
}


// Input field validation and formatting
document.addEventListener('DOMContentLoaded', function () {

    // Phone number validation and formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
            // Remove all non-digit characters except +
            let value = e.target.value.replace(/[^\d+]/g, '');

            // Auto-add +91 if user starts typing without it
            if (value.length > 0 && !value.startsWith('+')) {
                value = '+91' + value;
            }

            // Limit to 13 characters (+91XXXXXXXXXX)
            if (value.length > 13) {
                value = value.substring(0, 13);
            }

            e.target.value = value;
        });
    }

    // Pincode validation (numbers only, 6 digits)
    const pincodeInput = document.getElementById('zipcode');
    if (pincodeInput) {
        pincodeInput.addEventListener('input', function (e) {
            // Only allow numbers
            e.target.value = e.target.value.replace(/[^\d]/g, '');

            // Limit to 6 digits
            if (e.target.value.length > 6) {
                e.target.value = e.target.value.substring(0, 6);
            }
        });
    }

    // Name fields validation (letters and spaces only)
    const nameInputs = ['fname', 'lname', 'city', 'state'];
    nameInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function (e) {
                // Only allow letters and spaces
                e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, '');
            });
        }
    });

    // Email validation feedback
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function (e) {
            const email = e.target.value;
            const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

            if (email && !emailPattern.test(email)) {
                e.target.classList.add('is-invalid');
            } else {
                e.target.classList.remove('is-invalid');
            }
        });
    }

    // Form submission validation
    const form = document.getElementById('billing-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            if (!form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
                alert('Please fill all required fields correctly.');
            }
            form.classList.add('was-validated');
        });
    }
});

