// js/shop.js - With original template animations
let allProducts = [];
let filteredProducts = [];
let currentFilter = 'all';

$(document).ready(function () {
    console.log('Shop page loaded');
    initShop();
});

async function initShop() {
    try {
        showLoading();

        const [artworks, categories] = await Promise.all([
            artAPI.fetchArtworks(),
            artAPI.fetchCategories()
        ]);

        console.log('Fetched products:', artworks);

        // Filter only available artworks with prices
        allProducts = artworks.filter(artwork => {
            const price = artwork.price || artwork.Price || 0;
            const isAvailable = artwork.isAvailable !== false && artwork.IsAvailable !== false;
            return price > 0 && isAvailable;
        });

        filteredProducts = [...allProducts];

        loadCategoryFilters(categories);
        displayProducts(filteredProducts);
        updateResultCount();
        hideLoading();

        if (allProducts.length === 0) {
            $('#empty-shop').show();
        }

    } catch (error) {
        console.error('Error initializing shop:', error);
        hideLoading();
        showError();
    }
}

function loadCategoryFilters(categories) {
    const container = $('#category-filter-buttons');
    container.empty();

    categories.forEach(category => {
        const categoryName = category.Name || category.name || 'Unknown';
        const categorySlug = category.slug || '';

        const button = $('<button>')
            .addClass('btn btn-outline-dark me-2')
            .attr('id', `filter-${categorySlug}`)
            .text(categoryName)
            .on('click', function () {
                filterShop(categorySlug);
            });

        container.append(button);
    });
}

function displayProducts(products) {
    const grid = $('#product-grid');
    grid.empty();

    if (!products || products.length === 0) {
        grid.html(`
            <div class="col-12 text-center py-5">
                <h4>No artworks found in this category</h4>
                <p>Try selecting a different category</p>
            </div>
        `);
        return;
    }

    products.forEach(product => {
        const card = createProductCard(product);
        grid.append(card);
    });

    updateResultCount();
}

function createProductCard(product) {
    const title = product.title || product.Title || 'Untitled';
    const price = product.price || product.Price || 0;
    const slug = product.slug || product.documentId;
    const imageUrl = getProductImageUrl(product);

    // Create card with ORIGINAL TEMPLATE STRUCTURE AND ANIMATIONS
    const cardHtml = `
        <div class="col-md-3 mb-3 product-item link-effect">
            <div class="image-holder position-relative">
                <a href="artwork-detail.html?id=${product.documentId}">
                    <img src="${imageUrl}" 
                         alt="${title}" 
                         class="product-image img-fluid"
                         data-product-id="${product.id}">
                </a>
                <a href="#" class="btn-icon btn-wishlist" onclick="addToWishlist(event, '${product.id}')">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                        <use xlink:href="#heart"></use>
                    </svg>
                </a>
                <div class="product-content">
                    <h5 class="element-title text-uppercase fs-5 mt-3">
                        <a href="artwork-detail.html?id=${product.documentId}">${title}</a>
                    </h5>
                    <a href="#" class="text-decoration-none add-to-cart-link" 
                       data-after="Add to cart" 
                       onclick="addToCartFromShop(event, '${product.id}')">
                        <span>₹${price.toLocaleString()}</span>
                    </a>
                </div>
            </div>
        </div>
    `;

    const $card = $(cardHtml);

    // Add ONE-TIME error handler for images
    $card.find(`[data-product-id="${product.id}"]`).one('error', function () {
        $(this).attr('src', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E');
    });

    return $card;
}

function getProductImageUrl(product) {
    // Try multiple possible structures
    if (product.images?.data?.[0]?.attributes?.url) {
        const url = product.images.data[0].attributes.url;
        return url.startsWith('http') ? url : `https://growing-approval-51840080fc.strapiapp.com${url}`;
    }

    if (product.images?.data?.[0]?.url) {
        const url = product.images.data[0].url;
        return url.startsWith('http') ? url : `https://growing-approval-51840080fc.strapiapp.com${url}`;
    }

    if (Array.isArray(product.images) && product.images[0]?.url) {
        const url = product.images[0].url;
        return url.startsWith('http') ? url : `https://growing-approval-51840080fc.strapiapp.com${url}`;
    }

    if (product.Image?.url) {
        const url = product.Image.url;
        return url.startsWith('http') ? url : `https://growing-approval-51840080fc.strapiapp.com${url}`;
    }

    // Return gray placeholder
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e0e0e0" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';
}

function filterShop(categorySlug) {
    currentFilter = categorySlug;

    // Update active button
    $('.btn-group .btn').removeClass('active');
    $(`#filter-${categorySlug}`).addClass('active');

    // Filter products
    if (categorySlug === 'all') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => {
            const productCategory = product.category?.data?.attributes?.slug ||
                product.category?.slug ||
                product.Category?.slug;
            return productCategory === categorySlug;
        });
    }

    displayProducts(filteredProducts);
}

function sortArtworks() {
    const sortValue = $('#sort-select').val();
    let sorted = [...filteredProducts];

    switch (sortValue) {
        case 'price-low':
            sorted.sort((a, b) => (a.price || a.Price || 0) - (b.price || b.Price || 0));
            break;
        case 'price-high':
            sorted.sort((a, b) => (b.price || b.Price || 0) - (a.price || a.Price || 0));
            break;
        case 'name':
            sorted.sort((a, b) => {
                const nameA = (a.title || a.Title || '').toLowerCase();
                const nameB = (b.title || b.Title || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
            break;
        case 'newest':
            sorted.sort((a, b) => b.id - a.id);
            break;
        default:
            // default sorting - keep as is
            break;
    }

    displayProducts(sorted);
}

function addToCartFromShop(event, productId) {
    event.preventDefault();
    const product = allProducts.find(p => p.id == productId);

    if (product) {
        cart.addItem(product);
        showNotification('Added to cart!');
    }
}


function addToWishlist(event, productId) {
    event.preventDefault();
    // Implement wishlist functionality if needed
    showNotification('Added to wishlist!');
}

function updateResultCount() {
    const count = filteredProducts.length;
    const total = allProducts.length;
    $('#result-count').text(`Showing 1–${count} of ${total} results`);
}

function showNotification(message) {
    const notification = $(`
        <div class="alert alert-success position-fixed" 
             style="top: 80px; right: 20px; z-index: 9999; animation: slideIn 0.3s;">
            ${message}
        </div>
    `);

    $('body').append(notification);
    setTimeout(() => notification.fadeOut(300, function () { $(this).remove(); }), 2000);
}

function showLoading() {
    $('#shop-loading').show();
    $('#product-grid').hide();
    $('#empty-shop').hide();
}

function hideLoading() {
    $('#shop-loading').hide();
    $('#product-grid').show();
}

function showError() {
    $('#shop-loading').hide();
    $('#product-grid').html(`
        <div class="col-12 text-center py-5">
            <h3>Error Loading Shop</h3>
            <p>Unable to load artworks.</p>
            <button class="btn btn-primary" onclick="location.reload()">Retry</button>
        </div>
    `).show();
}
