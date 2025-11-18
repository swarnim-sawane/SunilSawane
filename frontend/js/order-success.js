
$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('order');

    // Get order from localStorage
    const orderData = JSON.parse(localStorage.getItem('lastOrder'));

    if (orderData) {
        displayOrderDetails(orderData);
    } else {
        $('#order-info').html('<p class="text-muted">Order details not found.</p>');
    }
});

function displayOrderDetails(order) {
    // Order Info
    $('#order-info').html(`
        <table class="table">
          <tbody>
            <tr>
              <td class="text-uppercase fw-bold">Order Number:</td>
              <td class="text-end">${order.orderNumber}</td>
            </tr>
            <tr>
              <td class="text-uppercase fw-bold">Payment ID:</td>
              <td class="text-end">${order.paymentId}</td>
            </tr>
            <tr>
              <td class="text-uppercase fw-bold">Order Date:</td>
              <td class="text-end">${new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })}</td>
            </tr>
            <tr>
              <td class="text-uppercase fw-bold">Order Total:</td>
              <td class="text-end text-primary fs-5"><strong>₹${order.total.toLocaleString()}</strong></td>
            </tr>
          </tbody>
        </table>
        <div class="alert alert-success mt-3 mb-0">
          <small>A confirmation email has been sent to <strong>${order.customer.email}</strong></small>
        </div>
      `);

    // Shipping Info
    const c = order.customer;
    $('#shipping-info').html(`
        <p class="mb-2"><strong class="text-uppercase">${c.firstName} ${c.lastName}</strong></p>
        <p class="mb-1">${c.address}</p>
        <p class="mb-1">${c.city}, ${c.state} - ${c.pincode}</p>
        <p class="mb-1"><strong>Email:</strong> ${c.email}</p>
        <p class="mb-0"><strong>Phone:</strong> ${c.phone}</p>
      `);

    // Order Items
    let itemsHtml = '<table class="table">';
    itemsHtml += `
        <thead class="border-bottom">
          <tr>
            <th class="text-uppercase">Artwork</th>
            <th class="text-uppercase text-center">Quantity</th>
            <th class="text-uppercase text-end">Price</th>
          </tr>
        </thead>
        <tbody>
      `;

    order.items.forEach(item => {
        itemsHtml += `
          <tr class="border-bottom">
            <td>${item.title}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-end">₹${(item.price * item.quantity).toLocaleString()}</td>
          </tr>
        `;
    });

    itemsHtml += `
        <tr class="border-bottom">
          <td colspan="2" class="text-end pt-3"><strong class="text-uppercase">Subtotal:</strong></td>
          <td class="text-end pt-3">₹${order.total.toLocaleString()}</td>
        </tr>
        <tr class="border-bottom">
          <td colspan="2" class="text-end"><strong class="text-uppercase">Shipping:</strong></td>
          <td class="text-end">Free</td>
        </tr>
        <tr>
          <td colspan="2" class="text-end pt-3"><strong class="text-uppercase fs-5">Total:</strong></td>
          <td class="text-end pt-3"><strong class="text-primary fs-5">₹${order.total.toLocaleString()}</strong></td>
        </tr>
      `;
    itemsHtml += '</tbody></table>';

    $('#items-info').html(itemsHtml);
}
