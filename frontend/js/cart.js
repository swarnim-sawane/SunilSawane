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
            existingItem.quantity = 1;
        } else {
            this.items.push({
                id: product.id,
                documentId: product.documentId,
                title: product.title || product.Title,
                price: product.price || product.Price,
                image: this.getImageUrl(product),
                slug: product.slug || product.documentId,
                quantity: 1,
                availabilityStatus: getCartArtworkAvailabilityStatus(product)
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
            item.quantity = 1;
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
        this.items = stored ? JSON.parse(stored).map(item => ({ ...item, quantity: 1 })) : [];
    },

    async refreshAvailability() {
        if (!window.artAPI || this.items.length === 0) {
            return this.items;
        }

        try {
            const artworks = await artAPI.fetchArtworks({ pageSize: 100 });
            const artworkMap = new Map();

            artworks.forEach(artwork => {
                [artwork.id, artwork.documentId, artwork.slug].forEach(key => {
                    if (key !== undefined && key !== null && key !== '') {
                        artworkMap.set(String(key), artwork);
                    }
                });
            });

            this.items = this.items.map(item => {
                const match = artworkMap.get(String(item.documentId || '')) ||
                    artworkMap.get(String(item.slug || '')) ||
                    artworkMap.get(String(item.id || ''));

                if (!match) {
                    return { ...item, availabilityStatus: 'not_for_sale' };
                }

                return {
                    ...item,
                    id: match.id || item.id,
                    documentId: match.documentId || item.documentId,
                    slug: match.slug || match.documentId || item.slug,
                    image: this.getImageUrl(match),
                    availabilityStatus: getCartArtworkAvailabilityStatus(match)
                };
            });

            this.saveToStorage();
        } catch (error) {
            console.warn('Unable to refresh cart artwork availability:', error);
        }

        return this.items;
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
        const image = product.images?.data?.[0]?.attributes ||
            product.images?.data?.[0] ||
            (Array.isArray(product.images) ? product.images[0] : null) ||
            product.Image?.data?.attributes ||
            product.Image?.data ||
            product.Image ||
            null;
        const formats = image?.formats || {};
        const preferredImage = formats?.small?.url || formats?.medium?.url || formats?.large?.url || image?.url;

        if (preferredImage) {
            const url = preferredImage;
            return url.startsWith('http') ? url : `${cartAssetBaseUrl}${url}`;
        }

        if (product.image && typeof product.image === 'string') {
            return product.image.startsWith('http') ? product.image : `${cartAssetBaseUrl}${product.image}`;
        }

        // Fallback: gray placeholder
        return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
    }
};

const cartDom = window.domUtils || {
    PLACEHOLDER_IMAGE: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E',
    safeUrl: (value, fallback) => value || fallback || '#',
    formatINR: (value) => '\u20b9' + (Number(value) || 0).toLocaleString('en-IN')
};
const cartArtworkAvailability = window.artworkAvailability;
const cartApiBaseUrl = window.ART_CONFIG?.apiBaseUrl || 'https://growing-approval-51840080fc.strapiapp.com/api';
const cartAssetBaseUrl = cartApiBaseUrl.replace(/\/api\/?$/, '');
const checkoutFlowTransitionKey = 'sunilsawaneCheckoutFlowTransition';
const checkoutFlowScrollKey = 'sunilsawaneCheckoutFlowScroll';
const checkoutTransitionDelayMs = 840;
let cartCheckoutTransitionInProgress = false;

// Initialize cart on page load
$(document).ready(function () {
    cart.init();
    if (document.getElementById('cart-items')) {
        refreshCartAvailabilityForPage();
    }
});

window.addEventListener('pageshow', resetCartCheckoutTransition);

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
        const price = Number(item.price) || 0;
        const detailHref = item.slug ? `artwork-detail.html?id=${encodeURIComponent(item.slug)}` : 'shop.html';
        const unavailable = isCartItemUnavailable(item);
        const availabilityStatus = getCartArtworkAvailabilityStatus(item);
        const $remove = $('<button>')
            .addClass('cart-remove-action')
            .attr('type', 'button')
            .text('Remove')
            .on('click', function () {
                removeFromCart(item.id);
            });

        const $card = $('<div>')
            .addClass(unavailable ? 'premium-cart-item cart-item-unavailable' : 'premium-cart-item')
            .attr('data-item-id', item.id)
            .append(
                $('<a>')
                    .addClass('cart-artwork-frame')
                    .attr({
                        href: detailHref,
                        'aria-label': `View ${item.title || 'artwork'}`
                    })
                    .append(
                        $('<img>')
                            .attr({
                                src: cartDom.safeUrl(item.image, cartDom.PLACEHOLDER_IMAGE),
                                alt: item.title || 'Artwork',
                                decoding: 'async'
                            })
                            .addClass('cart-item-image')
                    ),
                $('<div>').addClass('cart-item-body').append(
                    $('<p>').addClass('cart-item-edition').text('1 original artwork'),
                    $('<h3>').addClass('cart-item-title').append(
                        $('<a>').attr('href', detailHref).text(item.title || 'Untitled')
                    ),
                    $('<p>').addClass('cart-item-meta').text(unavailable
                        ? cartArtworkAvailability.getUnavailableMessage(availabilityStatus)
                        : 'One-of-one work reserved for checkout review'),
                    unavailable
                        ? $('<p>').addClass('cart-item-status').text(cartArtworkAvailability.getStatusLabel(availabilityStatus))
                        : null
                ),
                $('<div>').addClass('cart-item-purchase').append(
                    $('<strong>').addClass('cart-item-price').text(cartDom.formatINR(price)),
                    $remove
                )
            );

        container.append($card);
    });

    updateCartSummary();
    updateCheckoutAvailabilityState();
}

function updateCartSummary() {
    const total = cart.getTotal();
    $('#cart-summary-note').text(cartHasUnavailableItems()
        ? 'Remove unavailable work before checkout. Available works can still be acquired securely.'
        : 'Shipping, authenticity and damage support are confirmed at checkout.');
    $('#cart-subtotal').text(cartDom.formatINR(total));
    $('#cart-total').text(cartDom.formatINR(total));
}

function getCartArtworkAvailabilityStatus(artwork) {
    return cartArtworkAvailability.getStatus(artwork);
}

function isCartItemUnavailable(item) {
    return getCartArtworkAvailabilityStatus(item) !== 'available';
}

function cartHasUnavailableItems() {
    return cart.items.some(isCartItemUnavailable);
}

function updateCheckoutAvailabilityState() {
    const checkoutButton = document.getElementById('cart-checkout-button');
    if (!checkoutButton) return;

    const blocked = cartHasUnavailableItems();
    checkoutButton.disabled = blocked;
    checkoutButton.textContent = blocked ? 'Remove unavailable work before checkout' : 'Proceed to Checkout';
}

async function refreshCartAvailabilityForPage() {
    displayCart();
    await cart.refreshAvailability();
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

    if (cartHasUnavailableItems()) {
        alert('Please remove unavailable works before checkout.');
        updateCheckoutAvailabilityState();
        return;
    }

    if (cartCheckoutTransitionInProgress) {
        return;
    }

    const progress = document.querySelector('.cart-flow-progress');
    const checkoutButton = document.getElementById('cart-checkout-button');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!progress || prefersReducedMotion) {
        window.location.assign('checkout.html');
        return;
    }

    cartCheckoutTransitionInProgress = true;

    try {
        sessionStorage.setItem(checkoutFlowTransitionKey, 'cart-to-checkout');
        sessionStorage.setItem(checkoutFlowScrollKey, 'rail');
    } catch (error) {
        console.warn('Checkout transition state could not be saved:', error);
    }

    document.body.classList.add('checkout-flow-leaving');
    progress.classList.add('is-advancing-to-details');
    window.setTimeout(() => {
        progress.querySelectorAll('span').forEach((step, index) => {
            step.classList.toggle('is-current', index === 1);
        });
    }, 520);

    if (checkoutButton) {
        checkoutButton.disabled = true;
        checkoutButton.textContent = 'Opening checkout';
    }

    window.setTimeout(() => {
        window.location.assign('checkout.html');
    }, checkoutTransitionDelayMs);
}

function resetCartCheckoutTransition() {
    cartCheckoutTransitionInProgress = false;
    document.body.classList.remove('checkout-flow-leaving');

    const progress = document.querySelector('.cart-flow-progress');
    if (progress) {
        progress.classList.remove('is-advancing-to-details');
        progress.querySelectorAll('span').forEach((step, index) => {
            step.classList.toggle('is-current', index === 0);
        });
    }

    const checkoutButton = document.getElementById('cart-checkout-button');
    if (checkoutButton) {
        checkoutButton.disabled = false;
        checkoutButton.textContent = 'Proceed to Checkout';
    }
}

