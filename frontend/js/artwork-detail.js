
const STRAPI_URL = 'https://growing-approval-51840080fc.strapiapp.com';
let currentArtwork = null;

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

                mainImage.src = fullImageUrl;
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

        // Render meta information
        renderMetaInfo(data);

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

// Render thumbnail gallery
function renderThumbnails(data) {
    const thumbnailGallery = document.getElementById('thumbnail-gallery');
    if (!thumbnailGallery) return;

    thumbnailGallery.innerHTML = '';

    let imageUrl = null;

    if (data.image?.data?.attributes?.url) {
        imageUrl = data.image.data.attributes.url;
    } else if (data.image?.url) {
        imageUrl = data.image.url;
    }

    if (imageUrl) {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'thumbnail-item active';
        const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${STRAPI_URL}${imageUrl}`;
        thumbnail.innerHTML = `<img src="${fullUrl}" alt="${data.title || 'Artwork'}">`;
        thumbnail.onclick = function () {
            changeMainImage(imageUrl, this);
        };
        thumbnailGallery.appendChild(thumbnail);
    }
}

// Change main image
function changeMainImage(imageUrl, thumbnailElement) {
    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${STRAPI_URL}${imageUrl}`;
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        mainImage.src = fullUrl;
    }

    // Update active thumbnail
    document.querySelectorAll('.thumbnail-item').forEach(item => {
        item.classList.remove('active');
    });
    thumbnailElement.classList.add('active');
}

// Render meta information
// Render meta information
function renderMetaInfo(data) {
    const metaContainer = document.getElementById('product-meta');
    if (!metaContainer) return;

    console.log('Rendering meta with data:', data);

    // Build meta items array, only including items with actual values
    const metaItems = [];

    // Medium
    const medium = data.medium || data.Medium;
    if (medium && medium !== 'N/A') {
        metaItems.push({ label: 'Medium', value: medium });
    }

    // Dimensions
    const dimensions = data.dimensions || data.Dimensions;
    if (dimensions && dimensions !== 'N/A') {
        metaItems.push({ label: 'Dimensions', value: dimensions });
    }

    // Year Created (check multiple possible field names)
    const year = data.yearCreated || data.YearCreated || data.year || data.Year;
    if (year && year !== 'N/A') {
        metaItems.push({ label: 'Year', value: year });
    }

    // Category - Only show if it's an actual category name (not same as medium)
    const categoryName = data.category?.data?.attributes?.name ||
        data.Category?.data?.attributes?.name ||
        data.category?.name ||
        data.Category?.name;

    // Only add category if it exists and is different from medium
    if (categoryName && categoryName !== 'N/A' && categoryName !== medium) {
        metaItems.push({ label: 'Category', value: categoryName });
    }

    // Availability
    const inStock = data.inStock !== false && data.InStock !== false;
    metaItems.push({
        label: 'Availability',
        value: inStock ? 'In Stock' : 'Out of Stock'
    });

    // Render meta items
    metaContainer.innerHTML = metaItems.map(item => `
        <div class="product-meta-item">
            <span class="product-meta-label">${item.label}:</span>
            <span class="product-meta-value">${item.value}</span>
        </div>
    `).join('');

    console.log('Meta items rendered:', metaItems);
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
        quantity: quantity
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
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <svg width="24" height="24" fill="currentColor" class="me-2" viewBox="0 0 16 16">
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
            </svg>
            <div>${message}</div>
        </div>
    `;

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
        setTimeout(init, 100);
    });
} else {
    setTimeout(init, 100);
}
