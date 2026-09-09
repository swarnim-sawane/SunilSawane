// js/shop.js - With original template animations
let allProducts = [];
let filteredProducts = [];
let currentFilter = 'all';
let currentSeriesFilter = '';
let currentShopSearch = '';
let likedArtworks = [];
const WISHLIST_STORAGE_KEY = 'sunilSawaneLikedArtworks';
const savedWishlistProductIds = new Set();
const shopDom = window.domUtils;
const shopArtworkAvailability = window.artworkAvailability;
const shopDiscovery = window.artworkDiscovery;
const shopApiBaseUrl = window.ART_CONFIG?.apiBaseUrl || 'https://growing-approval-51840080fc.strapiapp.com/api';
const shopAssetBaseUrl = shopApiBaseUrl.replace(/\/api\/?$/, '');

$(document).ready(function () {
    console.log('Shop page loaded');
    initWishlistControls();
    initShopSearch();
    initShopSortMenu();
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

        // Keep sold works visible as catalogue records, but remove purchase affordances.
        allProducts = artworks
            .filter(shopArtworkAvailability.shouldShowInShop)
            .sort(shopArtworkAvailability.compareAvailability);

        filteredProducts = [...allProducts];

        loadCategoryFilters(shopDiscovery.getPopulatedCategories(categories, allProducts));
        loadSeriesFilters(shopDiscovery.getPopulatedSeries(allProducts));
        applyShopFilters();
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

function initWishlistControls() {
    loadWishlistFromStorage();
    updateWishlistHeader();
    renderLikedItemsPanel();

    $('#liked-items-toggle').on('click', openLikedItemsPanel);
    $('#liked-items-close, [data-liked-items-close]').on('click', closeLikedItemsPanel);

    $(document).on('keydown', function (event) {
        if (event.key === 'Escape') {
            closeLikedItemsPanel();
        }
    });
}

function loadWishlistFromStorage() {
    try {
        const stored = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]');
        likedArtworks = Array.isArray(stored) ? stored.filter(item => item && item.id) : [];
    } catch (error) {
        likedArtworks = [];
    }

    savedWishlistProductIds.clear();
    likedArtworks.forEach(item => savedWishlistProductIds.add(String(item.id)));
}

function saveWishlistToStorage() {
    try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(likedArtworks));
    } catch (error) {
        console.warn('Unable to save liked artworks:', error);
    }
}

function openLikedItemsPanel() {
    $('#liked-items-panel').addClass('is-open').attr('aria-hidden', 'false');
    $('#liked-items-toggle').attr('aria-expanded', 'true');
}

function closeLikedItemsPanel() {
    $('#liked-items-panel').removeClass('is-open').attr('aria-hidden', 'true');
    $('#liked-items-toggle').attr('aria-expanded', 'false');
}

function updateWishlistHeader() {
    const count = likedArtworks.length;
    $('#liked-items-count').text(count).toggle(count > 0);
    $('#liked-items-toggle')
        .toggleClass('has-liked-items', count > 0)
        .attr('aria-label', count > 0 ? `View ${count} liked artworks` : 'View liked artworks');
}

function renderLikedItemsPanel() {
    const $list = $('#liked-items-list');
    const $empty = $('#liked-items-empty');

    $list.empty();

    if (likedArtworks.length === 0) {
        $empty.show();
        return;
    }

    $empty.hide();

    likedArtworks.forEach(item => {
        const $removeButton = $('<button>')
            .attr('type', 'button')
            .addClass('liked-artwork-remove')
            .text('Remove')
            .on('click', function () {
                removeFromWishlist(item.id);
                showNotification('Removed from liked items');
            });

        const $card = $('<div>')
            .addClass('liked-artwork-card')
            .attr('data-liked-id', item.id)
            .append(
                $('<a>')
                    .addClass('liked-artwork-thumb')
                    .attr({ href: item.url, 'aria-label': `View ${item.title}` })
                    .append(
                        $('<img>').attr({
                            src: shopDom.safeUrl(item.image, shopDom.PLACEHOLDER_IMAGE),
                            alt: item.title || 'Artwork'
                        })
                    ),
                $('<div>').addClass('liked-artwork-meta').append(
                    $('<a>').addClass('liked-artwork-title').attr('href', item.url).text(item.title || 'Untitled'),
                    $('<span>').addClass('liked-artwork-price').text(shopDom.formatINR(item.price || 0)),
                    $('<div>').addClass('liked-artwork-actions').append(
                        $('<a>').addClass('liked-artwork-view').attr('href', item.url).text('View'),
                        $removeButton
                    )
                )
            );

        $list.append($card);
    });
}

function getWishlistItem(product) {
    const title = product.title || product.Title || 'Untitled';
    const price = product.price || product.Price || 0;
    const documentId = product.documentId || product.slug || '';

    return {
        id: String(product.id),
        title,
        price,
        image: shopDom.safeUrl(getProductImageUrl(product), shopDom.PLACEHOLDER_IMAGE),
        url: `artwork-detail.html?id=${encodeURIComponent(shopDom.text(documentId))}`
    };
}

function loadCategoryFilters(categories) {
    const container = $('#category-filter-buttons');
    container.empty();

    $('#filter-all')
        .empty()
        .append(
            $('<span>').text('All Artworks'),
            $('<span>').addClass('shop-filter-count').text(allProducts.length)
        );

    categories.forEach(category => {
        const categoryName = category.Name || category.name || 'Unknown';
        const categorySlug = category.slug || '';
        const productCount = getCategoryProductCount(categorySlug);

        if (!categorySlug || productCount === 0) {
            return;
        }

        const button = $('<button>')
            .addClass('btn shop-filter-button')
            .attr({
                id: `filter-${categorySlug}`,
                type: 'button',
                'aria-pressed': 'false'
            })
            .append(
                $('<span>').text(categoryName),
                $('<span>').addClass('shop-filter-count').text(productCount)
            )
            .on('click', function () {
                filterShop(categorySlug);
            });

        container.append(button);
    });
}

function displayProducts(products) {
    const grid = $('#product-grid');
    grid.empty();
    updateResultCount();

    if (!products || products.length === 0) {
        grid.append(
            $('<div>').addClass('col-12 text-center py-5').append(
                $('<h4>').text('No artworks match your selection'),
                $('<p>').text('Try another title, medium, subject, or category.')
            )
        );
        return;
    }

    products.forEach((product, index) => {
        const card = createProductCard(product, index);
        grid.append(card);
    });

    initPremiumCatalogueInteractions();
}

function createProductCard(product, index = 0) {
    const title = product.title || product.Title || 'Untitled';
    const price = product.price || product.Price || 0;
    const detailUrl = `artwork-detail.html?id=${encodeURIComponent(shopDom.text(product.documentId || ''))}`;
    const imageSources = getProductImageSources(product);
    const imageUrl = shopDom.safeUrl(imageSources.src, shopDom.PLACEHOLDER_IMAGE);
    const imageLoading = index < 3 ? 'eager' : 'lazy';
    const imagePriority = index < 3 ? 'high' : 'auto';
    const medium = product.medium || product.Medium || 'Artwork';
    const year = product.yearCreated || product.YearCreated || product.year || product.Year || '';
    const accent = getProductAccent(product);
    const status = shopArtworkAvailability.getStatus(product);
    const available = shopArtworkAvailability.isPurchasable(product);
    const statusClass = shopArtworkAvailability.getStatusClass(status);

    const $card = $('<div>').addClass('col-12 col-xl-4 col-lg-4 col-md-6 premium-product-item');
    const $article = $('<article>')
        .addClass(available
            ? 'premium-product-card collector-plinth-card is-available'
            : `premium-product-card collector-plinth-card is-unavailable ${statusClass}`)
        .attr('data-accent', accent)
        .css('--card-accent', accent);
    const $surface = $('<div>').addClass('premium-card-surface');
    const $image = $('<img>')
        .attr({
            src: imageUrl,
            srcset: imageSources.srcset || undefined,
            sizes: '(max-width: 767px) 92vw, (max-width: 1199px) 46vw, 31vw',
            alt: title,
            loading: imageLoading,
            decoding: 'async',
            fetchpriority: imagePriority
        })
        .addClass('premium-product-image')
        .data('product-id', product.id);
    const $imageLink = $('<a>')
        .addClass('premium-art-frame premium-art-matte')
        .attr({ href: detailUrl, 'aria-label': `View ${title}` })
        .append($image);

    if (!available) {
        $imageLink.append(
            $('<span>')
                .addClass(`premium-availability-tag ${statusClass}`)
                    .text(shopArtworkAvailability.getStatusLabel(status))
        );
    }

    const isWishlisted = savedWishlistProductIds.has(String(product.id));
    const $wishlist = $('<button>')
        .attr({
            type: 'button',
            'data-product-id': product.id,
            'aria-label': isWishlisted ? `Remove ${title} from liked items` : `Save ${title}`,
            'aria-pressed': isWishlisted ? 'true' : 'false'
        })
        .addClass('premium-card-icon btn-wishlist')
        .toggleClass('is-liked', isWishlisted)
        .on('click', function (event) {
            toggleWishlist(event, product);
        });
    const $svg = $(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
        .attr({ width: 24, height: 24, viewBox: '0 0 24 24' });
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#wishlist-cart');
    $svg.append(use);
    $wishlist.append($svg);

    const $cartButton = $('<button>')
        .attr({
            type: 'button',
            disabled: !available,
            'aria-disabled': available ? 'false' : 'true'
        })
        .addClass('premium-add-button')
        .text(shopArtworkAvailability.getPurchaseLabel(status))
        .on('click', function (event) {
            addToCartFromShop(event, product.id);
        });

    const $content = $('<div>').addClass('premium-card-content').append(
        $('<div>').addClass('premium-card-topline').append(
            $('<span>').addClass('premium-card-medium').text(medium),
            $('<span>').addClass('premium-card-price').text(shopDom.formatINR(price))
        ),
        $('<h3>').addClass('premium-card-title').append(
            $('<a>').attr('href', detailUrl).text(title)
        ),
        $('<div>').addClass('premium-card-caption').append(
            $('<span>').text(year ? `Created ${year}` : 'Collector catalogue')
        ),
        $('<div>').addClass('premium-card-actions').append(
            $('<a>').addClass('premium-view-link').attr('href', detailUrl).text('View Artwork'),
            $cartButton
        )
    );

    $surface.append($imageLink, $wishlist, $content);
    $article.append($surface);
    $card.append($article);

    // Add ONE-TIME error handler for images
    $image.one('error', function () {
        $(this)
            .removeAttr('srcset')
            .attr('src', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E');
    });

    return $card;
}

function isProductAvailable(product) {
    return shopArtworkAvailability.isPurchasable(product);
}

function isProductSold(product) {
    return shopArtworkAvailability.getStatus(product) === 'sold';
}

function getProductCategorySlug(product) {
    return product.category?.data?.attributes?.slug ||
        product.category?.slug ||
        product.Category?.slug ||
        product.Category?.data?.attributes?.slug ||
        '';
}

function getCategoryProductCount(categorySlug) {
    return allProducts.filter(product => getProductCategorySlug(product) === categorySlug).length;
}

function getProductAccent(product) {
    const accents = ['#8f6d39', '#4f6f64', '#7f4b3a', '#3f5368', '#6f6246'];
    const seed = Number(product.id || 0) || shopDom.text(product.documentId || product.title || '').length;
    return accents[Math.abs(seed) % accents.length];
}

function initPremiumCatalogueInteractions() {
    const cards = document.querySelectorAll('.premium-product-card');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, instance) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    instance.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.18 });

        cards.forEach(card => observer.observe(card));
    } else {
        cards.forEach(card => card.classList.add('is-revealed'));
    }

    cards.forEach(card => {
        card.addEventListener('pointermove', event => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
            card.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
        });

        card.addEventListener('pointerleave', () => {
            card.style.removeProperty('--pointer-x');
            card.style.removeProperty('--pointer-y');
        });
    });
}

function getProductImageAsset(product) {
    return product.images?.data?.[0]?.attributes ||
        product.images?.data?.[0] ||
        (Array.isArray(product.images) ? product.images[0] : null) ||
        product.Image?.data?.attributes ||
        product.Image?.data ||
        product.Image ||
        null;
}

function resolveProductImageUrl(url) {
    if (!url) return '';
    return url.startsWith('http') ? url : `${shopAssetBaseUrl}${url}`;
}

function getProductImageSources(product) {
    const image = getProductImageAsset(product);
    const formats = image?.formats || {};
    const variants = [formats?.small, formats?.medium, formats?.large]
        .filter(format => format?.url && format?.width)
        .map(format => `${resolveProductImageUrl(format.url)} ${format.width}w`);
    const preferredUrl = formats?.large?.url || formats?.medium?.url || formats?.small?.url || image?.url;

    return {
        src: resolveProductImageUrl(preferredUrl) || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e0e0e0" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E',
        srcset: variants.join(', ')
    };
}

function getProductImageUrl(product) {
    return getProductImageSources(product).src;
}

function filterShop(categorySlug) {
    currentFilter = categorySlug;
    currentSeriesFilter = '';

    // Update active button
    $('.shop-filter-button').removeClass('active').attr('aria-pressed', 'false');
    const activeButton = document.getElementById(`filter-${categorySlug}`);
    if (activeButton) {
        activeButton.classList.add('active');
        activeButton.setAttribute('aria-pressed', 'true');
    }

    applyShopFilters();
}

function loadSeriesFilters(series) {
    const group = document.getElementById('shop-series-filter-group');
    const container = $('#shop-series-filters');
    container.empty();

    if (!group || !series.length) {
        if (group) group.hidden = true;
        return;
    }

    group.hidden = false;
    series.forEach((entry, index) => {
        const button = $('<button>')
            .addClass('btn shop-filter-button series-filter-button')
            .attr({
                id: `shop-series-${index}`,
                type: 'button',
                'aria-pressed': 'false'
            })
            .append(
                $('<span>').text(entry.name),
                $('<span>').addClass('shop-filter-count').text(entry.count)
            )
            .on('click', function () {
                filterShopBySeries(entry.name, this);
            });

        container.append(button);
    });
}

function filterShopBySeries(seriesName, button) {
    currentFilter = 'all';
    currentSeriesFilter = seriesName;

    $('.shop-filter-button').removeClass('active').attr('aria-pressed', 'false');
    if (button) {
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
    }

    applyShopFilters();
}

function initShopSearch() {
    const searchInput = document.getElementById('shop-search');
    const clearButton = document.getElementById('shop-search-clear');
    if (!searchInput || !clearButton) return;

    searchInput.addEventListener('input', () => {
        currentShopSearch = searchInput.value;
        clearButton.hidden = currentShopSearch.length === 0;
        applyShopFilters();
    });

    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        currentShopSearch = '';
        clearButton.hidden = true;
        searchInput.focus();
        applyShopFilters();
    });
}

function initShopSortMenu() {
    const wrap = document.getElementById('shop-sort-wrap');
    const select = document.getElementById('sort-select');
    const button = document.getElementById('shop-sort-button');
    const menu = document.getElementById('shop-sort-menu');
    const value = document.getElementById('shop-sort-value');
    if (!wrap || !select || !button || !menu || !value) return;

    const options = Array.from(menu.querySelectorAll('.shop-sort-option'));
    const closeMenu = (restoreFocus = false) => {
        menu.hidden = true;
        button.setAttribute('aria-expanded', 'false');
        wrap.classList.remove('is-open');
        if (restoreFocus) button.focus();
    };
    const openMenu = () => {
        menu.hidden = false;
        button.setAttribute('aria-expanded', 'true');
        wrap.classList.add('is-open');
        const selected = options.find((option) => option.getAttribute('aria-selected') === 'true') || options[0];
        selected?.focus();
    };
    const chooseOption = (option) => {
        const nextValue = option.dataset.sortValue;
        options.forEach((item) => item.setAttribute('aria-selected', item === option ? 'true' : 'false'));
        select.value = nextValue;
        value.textContent = option.textContent.trim();
        select.dispatchEvent(new Event('change', { bubbles: true }));
        closeMenu(true);
    };

    wrap.classList.add('is-enhanced');
    button.addEventListener('click', () => {
        if (menu.hidden) openMenu();
        else closeMenu();
    });
    button.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openMenu();
        }
    });
    options.forEach((option) => option.addEventListener('click', () => chooseOption(option)));
    menu.addEventListener('keydown', (event) => {
        const activeIndex = options.indexOf(document.activeElement);
        if (event.key === 'Escape') {
            event.preventDefault();
            closeMenu(true);
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const direction = event.key === 'ArrowDown' ? 1 : -1;
            options[(activeIndex + direction + options.length) % options.length].focus();
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (activeIndex >= 0) chooseOption(options[activeIndex]);
        }
    });
    document.addEventListener('click', (event) => {
        if (!wrap.contains(event.target)) closeMenu();
    });
}

function applyShopFilters() {
    filteredProducts = shopDiscovery.filterArtworks(allProducts, {
        categorySlug: currentFilter,
        seriesName: currentSeriesFilter,
        query: currentShopSearch,
    });
    sortArtworks();
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

    displayProducts(sorted.sort(shopArtworkAvailability.compareAvailability));
}

function addToCartFromShop(event, productId) {
    event.preventDefault();
    const product = allProducts.find(p => p.id == productId);

    if (!isProductAvailable(product)) {
        showNotification(shopArtworkAvailability.getUnavailableMessage(product));
        return;
    }

    if (product) {
        cart.addItem(product);
        showNotification('Added to cart!');
    }
}


function toggleWishlist(event, product) {
    event.preventDefault();
    const button = event.currentTarget;
    const productId = String(product.id);
    const isWishlisted = savedWishlistProductIds.has(productId);

    if (isWishlisted) {
        removeFromWishlist(productId);
        showNotification('Removed from liked items');
        return;
    }

    likedArtworks = [
        getWishlistItem(product),
        ...likedArtworks.filter(item => String(item.id) !== productId)
    ];
    savedWishlistProductIds.add(productId);
    saveWishlistToStorage();
    updateWishlistHeader();
    renderLikedItemsPanel();
    setWishlistButtonState(button, product, true);

    showNotification('Artwork saved');
}

function removeFromWishlist(productId) {
    const normalizedId = String(productId);
    savedWishlistProductIds.delete(normalizedId);
    likedArtworks = likedArtworks.filter(item => String(item.id) !== normalizedId);
    saveWishlistToStorage();
    updateWishlistHeader();
    renderLikedItemsPanel();
    updateWishlistButtons(normalizedId, false);
}

function updateWishlistButtons(productId, isWishlisted) {
    document.querySelectorAll('.btn-wishlist').forEach(button => {
        if (String(button.getAttribute('data-product-id')) === String(productId)) {
            const product = allProducts.find(item => String(item.id) === String(productId));
            setWishlistButtonState(button, product, isWishlisted);
        }
    });
}

function setWishlistButtonState(button, product, isWishlisted) {
    if (!button) return;

    const title = product?.title || product?.Title || 'artwork';

    if (isWishlisted) {
        button.classList.add('is-liked');
        button.setAttribute('aria-pressed', 'true');
        button.setAttribute('aria-label', `Remove ${title} from liked items`);
    } else {
        button.classList.remove('is-liked');
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', `Save ${title}`);
    }
}

function updateResultCount() {
    const count = filteredProducts.length;
    const total = allProducts.length;
    $('#result-count').text(formatShopResultCount(count, total));
}

function formatShopResultCount(count, total) {
    if (total === 0) return 'No works';
    if (count === 0) return 'No works shown';
    if (count === total) return `${total} works`;
    return `${count} of ${total}`;
}

function showNotification(message) {
    const notification = $('<div>')
        .addClass('alert alert-success position-fixed')
        .attr('style', 'top: 80px; right: 20px; z-index: 9999; animation: slideIn 0.3s;')
        .text(message);

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
    $('#product-grid').empty().append(
        $('<div>').addClass('col-12 text-center py-5').append(
            $('<h3>').text('Error Loading Shop'),
            $('<p>').text('Unable to load artworks.'),
            $('<button>')
                .addClass('btn btn-primary')
                .text('Retry')
                .on('click', function () {
                    location.reload();
                })
        )
    ).show();
}
