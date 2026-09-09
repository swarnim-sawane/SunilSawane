
const DETAIL_API_BASE_URL = window.ART_CONFIG?.apiBaseUrl || 'https://growing-approval-51840080fc.strapiapp.com/api';
const STRAPI_URL = DETAIL_API_BASE_URL.replace(/\/api\/?$/, '');
const artworkAvailability = window.artworkAvailability;
const detailArtworkDiscovery = window.artworkDiscovery;
let currentArtwork = null;
let previousCollectorEnquiryFocus = null;
const detailDom = window.domUtils || {
    safeUrl: (value, fallback) => value || fallback || '#',
    text: (value) => value === undefined || value === null ? '' : String(value),
    clear: (element) => { if (element) element.replaceChildren(); },
    el: (tagName, options) => {
        const element = document.createElement(tagName);
        const opts = options || {};
        if (opts.className) element.className = opts.className;
        if (opts.text !== undefined) element.textContent = String(opts.text);
        Object.keys(opts.attrs || {}).forEach(name => {
            const value = opts.attrs[name];
            if (value !== undefined && value !== null) element.setAttribute(name, String(value));
        });
        (opts.children || []).forEach(child => {
            if (child !== undefined && child !== null) element.append(child);
        });
        return element;
    },
    formatINR: (value, options) => '\u20b9' + (Number(value) || 0).toLocaleString('en-IN', options)
};

// Get artwork ID from URL
function getArtworkId() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    console.log('Artwork ID from URL:', id);
    return id;
}

// Fetch artwork details from Strapi using documentId
async function fetchArtworkDetails(documentId) {
    try {
        console.log('Fetching artwork with documentId:', documentId);
        const response = await fetch(`${STRAPI_URL}/api/artworks?filters[documentId][$eq]=${documentId}&populate=*`);

        if (!response.ok) {
            throw new Error('Artwork not found');
        }

        const data = await response.json();
        console.log('Artwork data received:', data);

        if (!data.data || data.data.length === 0) {
            throw new Error('Artwork not found');
        }

        return data.data[0]; // Return the first item
    } catch (error) {
        console.error('Error fetching artwork:', error);
        throw error;
    }
}

// Render artwork details
function renderArtwork(artwork) {
    try {
        currentArtwork = artwork;

        console.log('Rendering artwork:', artwork);
        console.log('Artwork keys:', Object.keys(artwork));

        // CRITICAL: Data is directly on artwork object, NOT in attributes!
        const data = artwork; // No .attributes needed!

        console.log('Working with data:', data);

        // Set title - with null checks
        const title = data.title || 'Untitled Artwork';
        const titleElement = document.getElementById('product-title');
        const breadcrumbElement = document.getElementById('breadcrumb-title');
        const pageTitleElement = document.getElementById('page-title');

        if (titleElement) {
            titleElement.textContent = title;
            console.log('Title set:', title);
        } else {
            console.error('product-title element not found!');
        }

        if (breadcrumbElement) breadcrumbElement.textContent = title;
        if (pageTitleElement) pageTitleElement.textContent = title.toUpperCase();
        document.title = `${title} - Sunil Art Gallery`;

        // Set price - with null check
        const price = data.price || 0;
        const priceElement = document.getElementById('product-price');
        if (priceElement) {
            priceElement.textContent = `₹${price.toFixed(2)}`;
            priceElement.textContent = detailDom.formatINR(price);
            console.log('Price set:', price);
        } else {
            console.error('product-price element not found!');
        }

        // Set description - handle both string and array formats
        let description = 'No description available.';

        if (data.description) {
            description = data.description;
        } else if (data.Description) {
            if (Array.isArray(data.Description)) {
                description = data.Description.map(block => {
                    if (block.children) {
                        return block.children.map(child => child.text || '').join('');
                    }
                    return '';
                }).join('\n\n');
            } else {
                description = data.Description;
            }
        }

        const descElement = document.getElementById('product-description');
        if (descElement) {
            descElement.textContent = description;
            console.log('Description set');
        } else {
            console.error('product-description element not found!');
        }

        // Set main image - with null check
        // Set main image - with better error handling
        // Set main image - UNIVERSAL FIX
        // Set main image - FINAL FIX for images array
        const mainImage = document.getElementById('main-image');
        if (mainImage) {
            console.log('=== IMAGE DEBUG ===');
            console.log('Images field:', data.images);

            // Expand the images array to see its structure
            if (data.images && Array.isArray(data.images)) {
                console.log('Images array length:', data.images.length);
                console.log('First image object:', data.images[0]);
            }

            let imageUrl = null;

            // Try Pattern 1: data.images is a simple array with url property
            if (data.images?.[0]?.url) {
                imageUrl = data.images[0].url;
                console.log('✅ Pattern 1 matched (images[0].url):', imageUrl);
            }
            // Try Pattern 2: data.images[0].formats.medium/small/thumbnail.url
            else if (data.images?.[0]?.formats?.medium?.url) {
                imageUrl = data.images[0].formats.medium.url;
                console.log('✅ Pattern 2 matched (formats.medium):', imageUrl);
            }
            else if (data.images?.[0]?.formats?.small?.url) {
                imageUrl = data.images[0].formats.small.url;
                console.log('✅ Pattern 2b matched (formats.small):', imageUrl);
            }
            // Try Pattern 3: data.images.data[0].attributes.url
            else if (data.images?.data?.[0]?.attributes?.url) {
                imageUrl = data.images.data[0].attributes.url;
                console.log('✅ Pattern 3 matched (images.data[0].attributes):', imageUrl);
            }
            // Try Pattern 4: data.images.data.attributes.url (single image)
            else if (data.images?.data?.attributes?.url) {
                imageUrl = data.images.data.attributes.url;
                console.log('✅ Pattern 4 matched (images.data.attributes):', imageUrl);
            }

            if (imageUrl) {
                // Build full URL
                const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${STRAPI_URL}${imageUrl}`;
                console.log('✅ Final image URL:', fullImageUrl);

                mainImage.src = detailDom.safeUrl(fullImageUrl);
                mainImage.alt = title;

                mainImage.onerror = function () {
                    console.error('❌ Image failed to load:', this.src);
                    this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600"%3E%3Crect fill="%23f5f5f5" width="600" height="600"/%3E%3Ctext fill="%23d32f2f" x="50%25" y="45%25" text-anchor="middle" font-size="20"%3EImage Load Failed%3C/text%3E%3C/svg%3E';
                };

                mainImage.onload = function () {
                    console.log('✅ Image loaded successfully!');
                };
            } else {
                console.warn('❌ No image URL found');
                console.warn('Full images data:', JSON.stringify(data.images, null, 2));
                mainImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600"%3E%3Crect fill="%23f0f0f0" width="600" height="600"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" font-size="24"%3ENo Image Available%3C/text%3E%3C/svg%3E';
                mainImage.alt = 'No image available';
            }
        }



        // Render thumbnails
        renderThumbnails(data);

        renderSeriesContext(data);
        renderTrustSummary(data);
        updatePurchaseState(data);
        populateCollectorEnquiry(data);

        // Show product content - with null checks
        const loadingElement = document.getElementById('loading');
        const contentElement = document.getElementById('product-content');

        console.log('Loading element:', loadingElement);
        console.log('Content element:', contentElement);

        if (loadingElement) {
            loadingElement.style.display = 'none';
            console.log('Loading hidden');
        }

        if (contentElement) {
            contentElement.style.display = 'flex';
            console.log('✅ Product content displayed!');
        } else {
            console.error('❌ product-content element not found!');
        }
    } catch (error) {
        console.error('Error in renderArtwork:', error);
        showError(error.message);
    }
}

function getArtworkMedium(data) {
    return data.medium || data.Medium || 'Medium to be confirmed';
}

function getArtworkDimensions(data) {
    return data.dimensions || data.Dimensions || 'Size to be confirmed';
}

function getArtworkYear(data) {
    return data.yearCreated || data.YearCreated || data.year || data.Year || 'Year to be confirmed';
}

function isArtworkAvailable(data) {
    return artworkAvailability.isPurchasable(data);
}

function getArtworkAvailabilityLabel(data) {
    return artworkAvailability.getStatus(data) === 'available'
        ? 'Available for acquisition'
        : artworkAvailability.getStatusLabel(data);
}

function setDetailText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = detailDom.text(value);
}

function renderSeriesContext(data) {
    const element = document.getElementById('artwork-series-context');
    if (!element) return;

    const seriesName = detailArtworkDiscovery?.getArtworkSeriesName(data) || '';
    element.hidden = !seriesName;
    element.textContent = seriesName ? `From the ${seriesName} series` : '';

    const panel = document.querySelector('.artwork-purchase-panel');
    panel?.classList.toggle('is-series', Boolean(seriesName));
}

function renderTrustSummary(data) {
    setDetailText('trust-medium', getArtworkMedium(data));
    setDetailText('trust-dimensions', getArtworkDimensions(data));
    setDetailText('trust-year', getArtworkYear(data));
    setDetailText('trust-availability', getArtworkAvailabilityLabel(data));
    setDetailText('trust-original', 'Original one-of-one work');
}

function updatePurchaseState(data) {
    const addButton = document.querySelector('.artwork-purchase-panel .btn-add-cart');
    const enquiryButton = document.getElementById('collector-enquiry-open');
    const available = isArtworkAvailable(data);
    const status = artworkAvailability.getStatus(data);
    const panel = document.querySelector('.artwork-purchase-panel');

    if (panel) {
        panel.classList.toggle('is-unavailable', !available);
        panel.setAttribute('data-availability', status);
    }

    if (addButton) {
        addButton.disabled = !available;
        addButton.classList.toggle('is-disabled', !available);
        addButton.replaceChildren(document.createTextNode(
            available ? 'Add Artwork to Cart' : artworkAvailability.getPurchaseLabel(status)
        ));
        if (available) {
            addButton.prepend(
                detailDom.el('i', { className: 'fas fa-shopping-cart', attrs: { 'aria-hidden': 'true' } }),
                document.createTextNode(' ')
            );
        }
    }

    if (enquiryButton) {
        enquiryButton.textContent = artworkAvailability.getEnquiryLabel(status);
    }
}

function getArtworkTitle(data) {
    return data?.title || data?.Title || 'Untitled artwork';
}

function populateCollectorEnquiry(data) {
    const title = getArtworkTitle(data);
    const titleInput = document.getElementById('collector-artwork-title');
    const urlInput = document.getElementById('collector-artwork-url');
    const subjectInput = document.getElementById('collector-enquiry-subject');
    const messageInput = document.getElementById('collector-message');

    if (titleInput) titleInput.value = title;
    if (urlInput) urlInput.value = window.location.href;
    if (subjectInput) subjectInput.value = `Collector enquiry: ${title}`;
    if (messageInput && !messageInput.value.trim()) {
        messageInput.value = artworkAvailability.getEnquiryPrompt(data);
    }
}

function setCollectorEnquiryStatus(message, tone = '') {
    const status = document.getElementById('collector-enquiry-status');
    if (!status) return;

    status.textContent = message;
    status.classList.toggle('is-error', tone === 'error');
    status.classList.toggle('is-success', tone === 'success');
}

function openCollectorEnquiry() {
    const drawer = document.getElementById('collector-enquiry-drawer');
    const body = document.body;
    if (!drawer) return;

    previousCollectorEnquiryFocus = document.activeElement;
    populateCollectorEnquiry(currentArtwork || {});
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    body.classList.add('collector-enquiry-active');
    setCollectorEnquiryStatus('');

    const firstInput = document.getElementById('collector-name');
    if (firstInput) firstInput.focus();
}

function closeCollectorEnquiry() {
    const drawer = document.getElementById('collector-enquiry-drawer');
    const body = document.body;
    if (!drawer) return;

    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    body.classList.remove('collector-enquiry-active');

    if (previousCollectorEnquiryFocus && typeof previousCollectorEnquiryFocus.focus === 'function') {
        previousCollectorEnquiryFocus.focus();
    }
}

async function submitCollectorEnquiry(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = form.querySelector('.collector-enquiry-submit');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
    }
    setCollectorEnquiryStatus('Sending your enquiry...');

    try {
        const response = await fetch(form.action, {
            method: form.method,
            body: new FormData(form),
            headers: {
                Accept: 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('The enquiry could not be sent.');
        }

        setCollectorEnquiryStatus('Enquiry received. We will respond with availability and delivery details.', 'success');
        form.reset();
        populateCollectorEnquiry(currentArtwork || {});
    } catch (error) {
        setCollectorEnquiryStatus('Unable to send right now. Please call or email from the contact page.', 'error');
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Send enquiry';
        }
    }
}

function initCollectorEnquiry() {
    const openButton = document.getElementById('collector-enquiry-open');
    const form = document.getElementById('collector-enquiry-form');

    if (openButton) {
        openButton.addEventListener('click', openCollectorEnquiry);
    }

    document.querySelectorAll('[data-collector-enquiry-close]').forEach(button => {
        button.addEventListener('click', closeCollectorEnquiry);
    });

    if (form) {
        form.addEventListener('submit', submitCollectorEnquiry);
    }

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeCollectorEnquiry();
        }
    });
}

// Render thumbnail gallery
function renderThumbnails(data) {
    const thumbnailGallery = document.getElementById('thumbnail-gallery');
    if (!thumbnailGallery) return;

    detailDom.clear(thumbnailGallery);

    const imageUrls = [];

    if (Array.isArray(data.images)) {
        data.images.forEach(image => {
            const url = image?.url || image?.formats?.small?.url || image?.formats?.thumbnail?.url;
            if (url) imageUrls.push(url);
        });
    } else if (data.images?.data?.length) {
        data.images.data.forEach(image => {
            const url = image?.attributes?.url;
            if (url) imageUrls.push(url);
        });
    }

    if (data.image?.data?.attributes?.url) {
        imageUrls.push(data.image.data.attributes.url);
    } else if (data.image?.url) {
        imageUrls.push(data.image.url);
    }

    Array.from(new Set(imageUrls)).forEach((imageUrl, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = index === 0 ? 'thumbnail-item active' : 'thumbnail-item';
        const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${STRAPI_URL}${imageUrl}`;
        thumbnail.appendChild(detailDom.el('img', {
            attrs: {
                src: detailDom.safeUrl(fullUrl),
                alt: data.title || 'Artwork'
            }
        }));
        thumbnail.onclick = function () {
            changeMainImage(imageUrl, this);
        };
        thumbnailGallery.appendChild(thumbnail);
    });
}

// Change main image
function changeMainImage(imageUrl, thumbnailElement) {
    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${STRAPI_URL}${imageUrl}`;
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        mainImage.src = detailDom.safeUrl(fullUrl);
    }

    // Update active thumbnail
    document.querySelectorAll('.thumbnail-item').forEach(item => {
        item.classList.remove('active');
    });
    thumbnailElement.classList.add('active');
}

// Quantity controls
function incrementQuantity() {
    const input = document.getElementById('quantity');
    if (input) {
        const current = parseInt(input.value);
        if (current < parseInt(input.max)) {
            input.value = current + 1;
        }
    }
}

function decrementQuantity() {
    const input = document.getElementById('quantity');
    if (input) {
        const current = parseInt(input.value);
        if (current > parseInt(input.min)) {
            input.value = current - 1;
        }
    }
}

// Add to cart
// Add to cart with toast notification
// Add to cart with localStorage fallback
// Add to cart with proper localStorage handling
function addToCart() {
    if (!currentArtwork) return;

    if (!isArtworkAvailable(currentArtwork)) {
        showNotification(artworkAvailability.getUnavailableMessage(currentArtwork));
        return;
    }

    const quantity = parseInt(document.getElementById('quantity').value) || 1;

    // Extract image URL properly
    let imageUrl = '';
    if (currentArtwork.images?.[0]?.url) {
        imageUrl = currentArtwork.images[0].url;
    } else if (currentArtwork.images?.[0]?.formats?.medium?.url) {
        imageUrl = currentArtwork.images[0].formats.medium.url;
    }

    const cartItem = {
        id: currentArtwork.id,
        documentId: currentArtwork.documentId,
        title: currentArtwork.title,
        price: currentArtwork.price,
        image: imageUrl.startsWith('http') ? imageUrl : `${STRAPI_URL}${imageUrl}`,
        slug: currentArtwork.slug,
        quantity: quantity,
        availabilityStatus: artworkAvailability.getStatus(currentArtwork)
    };

    console.log('📦 Adding to cart:', cartItem);

    // Get existing cart
    let cart = [];
    try {
        const cartData = localStorage.getItem('cart');
        cart = cartData ? JSON.parse(cartData) : [];
        console.log('✅ Current cart:', cart);
    } catch (e) {
        console.error('❌ Error reading cart:', e);
        alert('Unable to access cart. Please check browser settings.');
        return;
    }

    // Check if item already exists
    const existingIndex = cart.findIndex(item => item.documentId === cartItem.documentId);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
        console.log('✅ Updated existing item quantity');
    } else {
        cart.push(cartItem);
        console.log('✅ Added new item to cart');
    }

    // Save cart
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
        console.log('✅ Cart saved:', cart);
        console.log('✅ Total items:', cart.reduce((sum, item) => sum + item.quantity, 0));

        // Show success notification
        showNotification(`${cartItem.title} has been added to your cart!`);

        // Trigger cart update event
        window.dispatchEvent(new Event('cartUpdated'));
        console.log('✅ Cart update event dispatched');

        // Force update cart count immediately
        if (typeof updateCartCount === 'function') {
            updateCartCount();
        }
    } catch (e) {
        console.error('❌ Failed to save cart:', e);
        alert('Unable to save cart. Please check browser privacy settings.');
    }
}



// Show notification toast (same as shop.html)
function showNotification(message) {
    // Remove any existing notifications first
    const existing = document.querySelectorAll('.cart-toast-notification');
    existing.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = 'alert alert-success position-fixed cart-toast-notification';
    notification.style.cssText = 'top: 80px; right: 20px; z-index: 9999; min-width: 300px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); animation: slideInRight 0.3s ease-out;';

    const content = document.createElement('div');
    content.className = 'd-flex align-items-center';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('class', 'me-2');
    svg.setAttribute('viewBox', '0 0 16 16');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z');
    svg.appendChild(path);
    content.appendChild(svg);
    content.appendChild(detailDom.el('div', { text: message }));
    notification.appendChild(content);

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Show error
function showError(message) {
    console.log('Showing error:', message);
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const messageEl = document.getElementById('error-message');

    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'block';
    if (messageEl) messageEl.textContent = message;
}

// Initialize page
async function init() {
    console.log('=== Init started ===');
    const artworkId = getArtworkId();

    if (!artworkId) {
        showError('No artwork ID provided. Please select an artwork from the shop.');
        return;
    }

    try {
        const artwork = await fetchArtworkDetails(artworkId);
        renderArtwork(artwork);
    } catch (error) {
        showError(error.message || 'Failed to load artwork details. Please try again.');
    }
}

// Run on page load - with delay to ensure DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initCollectorEnquiry();
        setTimeout(init, 100);
    });
} else {
    initCollectorEnquiry();
    setTimeout(init, 100);
}
