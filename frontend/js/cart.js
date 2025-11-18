// js/cart.js - Updated version with better image handling
const cart = {
    items: [],

    init() {
        this.loadFromStorage();
        this.updateCartCount();
    },

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                id: product.id,
                title: product.title || product.Title,
                price: product.price || product.Price,
                image: this.getImageUrl(product),
                slug: product.slug || product.documentId,
                quantity: 1
            });
        }

        this.saveToStorage();
        this.updateCartCount();
        return true;
    },

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveToStorage();
        this.updateCartCount();
    },

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.saveToStorage();
            this.updateCartCount();
        }
    },

    getTotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    getItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    },

    clear() {
        this.items = [];
        this.saveToStorage();
        this.updateCartCount();
    },

    saveToStorage() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    },

    loadFromStorage() {
        const stored = localStorage.getItem('cart');
        this.items = stored ? JSON.parse(stored) : [];
    },

    updateCartCount() {
        const count = this.getItemCount();
        $('.cart-count').text(count);
        if (count > 0) {
            $('.cart-count').show();
        } else {
            $('.cart-count').hide();
        }
    },

    getImageUrl(product) {
        // Try multiple possible image structures

        // Structure 1: images.data[0].attributes.url
        if (product.images?.data?.[0]?.attributes?.url) {
            const url = product.images.data[0].attributes.url;
            return url.startsWith('http') ? url : `http://localhost:1337${url}`;
        }

        // Structure 2: images.data[0].url
        if (product.images?.data?.[0]?.url) {
            const url = product.images.data[0].url;
            return url.startsWith('http') ? url : `http://localhost:1337${url}`;
        }

        // Structure 3: images[0].url (array)
        if (Array.isArray(product.images) && product.images[0]?.url) {
            const url = product.images[0].url;
            return url.startsWith('http') ? url : `http://localhost:1337${url}`;
        }

        // Structure 4: Image.url (single image field)
        if (product.Image?.url) {
            const url = product.Image.url;
            return url.startsWith('http') ? url : `http://localhost:1337${url}`;
        }

        // Structure 5: image (direct URL string)
        if (product.image && typeof product.image === 'string') {
            return product.image.startsWith('http') ? product.image : `http://localhost:1337${product.image}`;
        }

        // Fallback: gray placeholder
        return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
    }
};

// Initialize cart on page load
$(document).ready(function () {
    cart.init();
});



// Cart page specific code
$(document).ready(function () {
    displayCart();
});

// Custom Confirm Dialog
function customConfirm(message, title = 'Confirm Action') {
    return new Promise((resolve) => {
        const modal = document.getElementById('customConfirmModal');
        const titleEl = modal.querySelector('.modal-title');
        const messageEl = modal.querySelector('.modal-message');
        const confirmBtn = document.getElementById('modalConfirm');
        const cancelBtn = document.getElementById('modalCancel');

        // Set content
        titleEl.textContent = title;
        messageEl.textContent = message;

        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Handle confirm
        const handleConfirm = () => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            cleanup();
            resolve(true);
        };

        // Handle cancel
        const handleCancel = () => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            cleanup();
            resolve(false);
        };

        // Cleanup
        const cleanup = () => {
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleOverlayClick);
        };

        // Handle overlay click
        const handleOverlayClick = (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        };

        // Attach listeners
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleOverlayClick);
    });
}


function displayCart() {
    const items = cart.items;
    const container = $('#cart-items');

    if (items.length === 0) {
        $('#empty-cart').show();
        $('#cart-summary').hide();
        container.empty();
        return;
    }

    $('#empty-cart').hide();
    $('#cart-summary').show();
    container.empty();

    items.forEach(item => {
        const itemHtml = `
                <div class="card mb-3" data-item-id="${item.id}">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-2">
                                <img src="${item.image}" alt="${item.title}" class="cart-item-image">
                            </div>
                            <div class="col-md-4">
                                <h5>${item.title}</h5>
                                <p class="text-muted mb-0">₹${item.price.toLocaleString()}</p>
                            </div>
                            <div class="col-md-3">
                                <div class="input-group">
                                    <button class="btn btn-outline-secondary" onclick="updateItemQuantity(${item.id}, ${item.quantity - 1})">-</button>
                                    <input type="text" class="form-control text-center" value="${item.quantity}" readonly>
                                    <button class="btn btn-outline-secondary" onclick="updateItemQuantity(${item.id}, ${item.quantity + 1})">+</button>
                                </div>
                            </div>
                            <div class="col-md-2 text-end">
                                <strong>₹${(item.price * item.quantity).toLocaleString()}</strong>
                            </div>
                            <div class="col-md-1 text-end">
                                <button class="btn btn-danger btn-sm" onclick="removeFromCart(${item.id})">
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        container.append(itemHtml);
    });

    updateCartSummary();
}

function updateCartSummary() {
    const total = cart.getTotal();
    $('#cart-subtotal').text('₹' + total.toLocaleString());
    $('#cart-total').text('₹' + total.toLocaleString());
}

function updateItemQuantity(productId, newQuantity) {
    if (newQuantity < 1) return;
    cart.updateQuantity(productId, newQuantity);
    displayCart();
}

async function removeFromCart(productId) {
    const confirmed = await customConfirm(
        'Are you sure you want to remove this item from your cart?',
        'Remove Item?'
    );

    if (confirmed) {
        cart.removeItem(productId);
        displayCart();
    }
}



function proceedToCheckout() {
    const items = cart.items;

    if (items.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

