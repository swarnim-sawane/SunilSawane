const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const frontendRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(frontendRoot, file), 'utf8');

test('shop page keeps the catalogue controls seamless and restrained', () => {
  const shopHtml = read('shop.html');
  const shopJs = read('js/shop.js');
  const css = read('style.css');

  assert.match(shopHtml, /shop-hero/);
  assert.match(shopHtml, /<h1 class="display-2 text-uppercase text-dark">Shop<\/h1>/);
  assert.match(shopHtml, /aria-label="Shop path"/);
  assert.match(shopHtml, /<a href="index\.html">Home<\/a>[\s\S]{0,140}<span class="item" aria-hidden="true">&gt;<\/span>/);
  assert.doesNotMatch(shopHtml, /aria-hidden="true">\/<\/span>/);
  assert.match(shopHtml, /shop-catalogue-panel/);
  assert.match(shopHtml, /collector-shop-experience/);
  assert.match(shopHtml, /shop-filter-rail/);
  assert.match(shopHtml, /collector-filter-dock/);
  assert.match(shopHtml, /shop-filter-actions/);
  assert.match(shopHtml, /<span id="result-count" class="shop-result-count" aria-live="polite">Loading works\.\.\.<\/span>/);
  assert.match(shopHtml, /premium-product-grid/);
  assert.match(shopHtml, /id="liked-items-toggle"/);
  assert.match(shopHtml, /id="liked-items-count"/);
  assert.match(shopHtml, /id="liked-items-panel"/);
  assert.match(shopHtml, /id="liked-items-list"/);
  assert.match(shopHtml, /<li class="nav-action-item liked-items-nav-item">/);
  assert.match(shopHtml, /<li class="nav-action-item cart-nav-item">/);
  assert.match(shopHtml, /class="header-action-link position-relative"/);
  assert.doesNotMatch(shopHtml, /collector-catalogue-header/);
  assert.doesNotMatch(shopHtml, /collector-scroll-progress/);
  assert.doesNotMatch(shopHtml, /Original artworks/);
  assert.doesNotMatch(shopHtml, /collector-catalogue-note/);

  assert.match(shopJs, /premium-product-item/);
  assert.match(shopJs, /premium-product-card/);
  assert.match(shopJs, /premium-card-surface/);
  assert.match(shopJs, /View Artwork/);
  assert.match(shopJs, /function isProductAvailable/);
  assert.match(shopJs, /function isProductSold/);
  assert.match(shopJs, /premium-product-card collector-plinth-card is-unavailable/);
  assert.match(shopJs, /premium-availability-tag/);
  assert.match(shopJs, /shopArtworkAvailability\.getStatusLabel/);
  assert.match(shopJs, /shopArtworkAvailability\.getUnavailableMessage/);
  assert.match(shopJs, /if \(!isProductAvailable\(product\)\)/);
  assert.match(shopJs, /formatShopResultCount/);
  assert.match(shopJs, /`\$\{total\} works`/);
  assert.doesNotMatch(shopJs, /works available/);
  assert.match(shopJs, /getCategoryProductCount/);
  assert.match(shopJs, /initPremiumCatalogueInteractions/);
  assert.match(shopJs, /IntersectionObserver/);
  assert.match(shopJs, /'aria-pressed': isWishlisted \? 'true' : 'false'/);
  assert.match(shopJs, /classList\.add\('is-liked'\)/);
  assert.match(shopJs, /classList\.remove\('is-liked'\)/);
  assert.match(shopJs, /WISHLIST_STORAGE_KEY/);
  assert.match(shopJs, /toggleWishlist/);
  assert.match(shopJs, /renderLikedItemsPanel/);
  assert.match(shopJs, /updateWishlistHeader/);
  assert.match(shopJs, /localStorage\.setItem\(WISHLIST_STORAGE_KEY/);
  assert.match(shopJs, /Artwork saved/);
  assert.match(shopJs, /Removed from liked items/);
  assert.doesNotMatch(shopJs, /premium-card-scrim/);
  assert.doesNotMatch(shopJs, /Original artwork/);
  assert.doesNotMatch(shopJs, /Original work/);
  assert.doesNotMatch(shopJs, /View close-up/);

  assert.match(css, /\.collector-shop-experience/);
  assert.match(css, /\.collector-filter-dock/);
  assert.match(css, /\.shop-filter-actions/);
  assert.doesNotMatch(css, /\.collector-scroll-progress/);
  assert.match(css, /\.shop-catalogue-panel/);
  assert.match(css, /\.premium-product-grid/);
  assert.match(css, /\.premium-product-card/);
  assert.match(css, /\.premium-product-card:hover/);
  assert.match(css, /\.premium-product-card::before/);
  assert.match(css, /\.premium-product-card\.is-revealed/);
  assert.match(css, /\.collector-shop-experience\s+\.premium-card-actions\s*{[^}]*border-top:\s*0;/s);
  assert.match(css, /\.collector-shop-experience\s+\.btn-wishlist:hover/s);
  assert.match(css, /\.collector-shop-experience\s+\.btn-wishlist\.is-liked/s);
  assert.match(css, /border-color:\s*rgba\(148,\s*55,\s*43,\s*0\.38\)/);
  assert.match(css, /\.liked-items-toggle/s);
  assert.match(css, /\.liked-items-panel\.is-open/s);
  assert.match(css, /\.liked-artwork-card/s);
  assert.match(css, /\.shop-page\s+#header\s*\{/s);
  assert.match(css, /--shop-header-clearance:\s*var\(--site-header-clearance\)/);
  assert.match(css, /background:\s*rgba\(255,\s*255,\s*255,\s*0\.58\)/);
  assert.match(css, /backdrop-filter:\s*blur\(22px\)\s+saturate\(1\.18\)/);
  assert.doesNotMatch(css, /background:\s*rgba\(255,\s*255,\s*255,\s*0\.96\)/);
  assert.match(css, /\.nav-action-item\s*\{/s);
  assert.match(css, /\.header-action-link,\s*\.liked-items-toggle\s*\{/s);
  assert.match(css, /\.shop-page\s+\.collector-filter-dock\s*\{/s);
  assert.match(css, /\.collector-shop-experience\s+\.premium-product-card:hover,\s*\.collector-shop-experience\s+\.premium-product-card:focus-within\s*{[^}]*box-shadow:\s*none;/s);
  assert.match(css, /\.collector-shop-experience\s+\.premium-card-surface\s*{[^}]*border:\s*1px solid transparent;/s);
  assert.match(css, /\.collector-shop-experience\s+\.premium-card-surface\s*{[^}]*linear-gradient\(145deg,\s*rgba\(var\(--bs-primary-rgb\),\s*0\.16\),\s*rgba\(255,\s*255,\s*255,\s*0\.18\)\s*42%,\s*rgba\(143,\s*109,\s*57,\s*0\.12\)\)\s*border-box;/s);
  assert.match(css, /\.collector-shop-experience\s+\.premium-card-surface\s*{[^}]*outline:\s*1px solid rgba\(var\(--bs-primary-rgb\),\s*0\.045\);/s);
  assert.match(css, /\.collector-shop-experience\s+\.premium-product-card:hover\s+\.premium-card-surface,\s*\.collector-shop-experience\s+\.premium-product-card:focus-within\s+\.premium-card-surface\s*{[^}]*transform:\s*none;/s);
  assert.match(css, /\.collector-shop-experience\s+\.premium-product-card:hover\s+\.premium-card-surface,\s*\.collector-shop-experience\s+\.premium-product-card:focus-within\s+\.premium-card-surface\s*{[^}]*outline-color:\s*rgba\(var\(--bs-primary-rgb\),\s*0\.1\);/s);
  assert.match(css, /\.collector-shop-experience\s+\.premium-product-card::before\s*{[^}]*bottom:\s*44%;/s);
  assert.match(css, /\.collector-shop-experience\s+\.premium-card-content\s*{[^}]*background:\s*transparent;/s);
  assert.match(css, /\.collector-shop-experience\s+\.premium-product-card:hover\s+\.premium-art-frame,\s*\.collector-shop-experience\s+\.premium-product-card:focus-within\s+\.premium-art-frame\s*{[^}]*box-shadow:\s*inset 0 0 0 14px rgba\(255,\s*255,\s*255,\s*0\.55\);/s);
  assert.match(css, /\.collector-shop-experience\s+\.premium-add-button\s*{[^}]*background:\s*transparent;/s);
  assert.match(css, /\.collector-shop-experience\s+\.premium-add-button\s*{[^}]*width:\s*auto;/s);
  assert.match(css, /\.collector-shop-experience\s+\.premium-add-button:hover,\s*\.collector-shop-experience\s+\.premium-add-button:focus-visible\s*{[^}]*background:\s*transparent;/s);
  assert.match(css, /\.collector-shop-experience\s+\.premium-product-card\.is-unavailable/s);
  assert.match(css, /\.premium-availability-tag/s);
  assert.match(css, /\.collector-shop-experience\s+\.premium-add-button:disabled/s);
  assert.doesNotMatch(css, /0\s+24px\s+48px\s+rgba\(30,\s*26,\s*20,\s*0\.12\)/);
  assert.doesNotMatch(css, /\.premium-card-scrim/);
});

test('shop cards use responsive artwork variants without eagerly decoding the full catalogue', () => {
  const shopJs = read('js/shop.js');

  assert.match(shopJs, /products\.forEach\(\(product, index\)\s*=>/);
  assert.match(shopJs, /createProductCard\(product, index\)/);
  assert.match(shopJs, /function createProductCard\(product, index = 0\)/);
  assert.match(shopJs, /index < 3 \? 'eager' : 'lazy'/);
  assert.match(shopJs, /decoding:\s*'async'/);
  assert.match(shopJs, /fetchpriority:\s*imagePriority/);
  assert.match(shopJs, /srcset:\s*imageSources\.srcset/);
  assert.match(shopJs, /sizes:\s*'\(max-width: 767px\) 92vw, \(max-width: 1199px\) 46vw, 31vw'/);
  assert.match(shopJs, /function getProductImageSources\(product\)/);
  assert.match(shopJs, /formats\?\.large/);
  assert.match(shopJs, /formats\?\.medium/);
  assert.match(shopJs, /formats\?\.small/);
});

test('shop discovery controls provide search and an enhanced accessible sort menu', () => {
  const shopHtml = read('shop.html');
  const shopJs = read('js/shop.js');
  const css = read('style.css');

  assert.match(shopHtml, /id="shop-search"/);
  assert.match(shopHtml, /aria-label="Search artworks"/);
  assert.match(shopHtml, /id="shop-sort-button"/);
  assert.match(shopHtml, /role="listbox"/);
  assert.match(shopHtml, /js\/artwork-discovery\.js/);
  assert.match(shopJs, /getPopulatedCategories/);
  assert.match(shopJs, /filterArtworks/);
  assert.match(shopJs, /initShopSortMenu/);
  assert.match(shopJs, /grid\.empty\(\);\s*updateResultCount\(\);\s*if \(!products/s);
  assert.match(css, /\.artwork-search-control/);
  assert.match(css, /\.shop-sort-menu/);
  assert.match(css, /\.shop-sort-option\[aria-selected="true"\]/);
});

test('shop discovery uses a clean two-row layout with a populated series filter', () => {
  const shopHtml = read('shop.html');
  const shopJs = read('js/shop.js');
  const css = read('style.css');

  assert.match(shopHtml, /shop-discovery-primary/);
  assert.match(shopHtml, /id="shop-series-filters"/);
  assert.match(shopHtml, /shop-filter-scroll/);
  assert.match(shopJs, /getPopulatedSeries/);
  assert.match(shopJs, /filterShopBySeries/);
  assert.match(shopJs, /seriesName:\s*currentSeriesFilter/);
  assert.match(css, /\.shop-filter-scroll[\s\S]*overflow-x:\s*auto/);
});

test('shop and cart scripts do not redeclare the availability helper globally', () => {
  const shopJs = read('js/shop.js');
  const cartJs = read('js/cart.js');

  assert.match(shopJs, /const shopArtworkAvailability = window\.artworkAvailability/);
  assert.match(cartJs, /const cartArtworkAvailability = window\.artworkAvailability/);
  assert.doesNotMatch(shopJs + cartJs, /const artworkAvailability = window\.artworkAvailability/);
});

test('product detail page uses artwork-led purchase layout', () => {
  const detailHtml = read('artwork-detail.html');
  const detailJs = read('js/artwork-detail.js');
  const css = read('style.css');

  assert.match(detailHtml, /artwork-detail-hero/);
  assert.match(detailHtml, /aria-label="Artwork path"/);
  assert.match(detailHtml, /<a href="index\.html">Home<\/a>[\s\S]{0,180}<a href="shop\.html">Shop<\/a>/);
  assert.match(detailHtml, /<span class="item" aria-hidden="true">&gt;<\/span>/);
  assert.doesNotMatch(detailHtml, /aria-hidden="true">\/<\/span>/);
  assert.match(detailHtml, /artwork-purchase-panel/);
  assert.match(detailHtml, /artwork-detail-kicker/);
  assert.match(detailHtml, /artwork-trust-summary/);
  assert.match(detailHtml, /id="trust-medium"/);
  assert.match(detailHtml, /id="trust-dimensions"/);
  assert.match(detailHtml, /id="trust-year"/);
  assert.match(detailHtml, /id="trust-availability"/);
  assert.match(detailHtml, /id="trust-original"/);
  assert.match(detailHtml, /Add Artwork to Cart/);
  assert.match(detailHtml, /type="hidden" id="quantity"/);
  assert.doesNotMatch(detailHtml, /id="product-meta"/);
  assert.doesNotMatch(detailHtml, /collector-note/);
  assert.doesNotMatch(detailHtml, /class="quantity-selector"/);
  assert.doesNotMatch(detailHtml, /artwork-assurance-grid/);
  assert.doesNotMatch(detailHtml, /Securely packed for shipping/);
  assert.doesNotMatch(detailHtml, /Certificate of authenticity/);
  assert.doesNotMatch(detailHtml, /Return &amp; damage support/);
  assert.doesNotMatch(detailHtml, /collector-checkout-note/);

  assert.match(detailJs, /renderTrustSummary/);
  assert.match(detailJs, /trust-medium/);
  assert.match(detailJs, /trust-dimensions/);
  assert.match(detailJs, /trust-year/);
  assert.match(detailJs, /trust-availability/);
  assert.match(detailJs, /Original one-of-one work/);
  assert.match(detailJs, /if \(!isArtworkAvailable\(currentArtwork\)\)/);
  assert.match(detailJs, /artworkAvailability\.getUnavailableMessage/);
  assert.match(detailJs, /artworkAvailability\.getEnquiryLabel/);
  assert.doesNotMatch(detailJs, /function renderMetaInfo/);
  assert.doesNotMatch(detailJs, /product-meta/);

  assert.match(css, /\.artwork-detail-hero/);
  assert.match(css, /\.artwork-purchase-panel/);
  assert.match(css, /\.artwork-trust-summary/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /\.btn-add-cart\.is-disabled/s);
  assert.doesNotMatch(css, /\.artwork-purchase-panel\s+\.product-meta/);
});

test('order success page feels like a premium collector confirmation', () => {
  const successHtml = read('order-success.html');
  const successJs = read('js/order-success.js');
  const css = read('style.css');

  assert.match(successHtml, /body class="bg-body order-success-page"/);
  assert.match(successHtml, /style\.css\?v=premium-order-success-/);
  assert.match(successHtml, /hero-section checkout-hero order-success-hero/);
  assert.match(successHtml, /Acquisition confirmed/);
  assert.match(successHtml, /Payment received/);
  assert.match(successHtml, /order-success-section/);
  assert.match(successHtml, /order-success-shell/);
  assert.match(successHtml, /success-receipt-panel/);
  assert.match(successHtml, /success-artwork-panel/);
  assert.match(successHtml, /success-next-steps/);
  assert.match(successHtml, /This original is reserved under your order and no longer available for purchase/);
  assert.doesNotMatch(successHtml, /Thank You for Your Order!/);
  assert.doesNotMatch(successHtml, /bg-grey padding-small/);
  assert.doesNotMatch(successHtml, /marked sold in the collection/i);

  assert.match(successJs, /displayOrderDetails/);
  assert.match(successJs, /initOrderSuccessPage/);
  assert.match(successJs, /fetchPublicOrderReceipt/);
  assert.match(successJs, /requestPublicOrderReceipt/);
  assert.match(successJs, /XMLHttpRequest/);
  assert.match(successJs, /getSuccessOrderNumberFromUrl/);
  assert.match(successJs, /orders\/receipt/);
  assert.match(successJs, /renderSuccessArtworkCards/);
  assert.match(successJs, /success-artwork-card/);
  assert.match(successJs, /success-status-pill/);
  assert.match(successJs, /Acquisition secured/);
  assert.doesNotMatch(successJs, /Marked as sold in the collection/);
  assert.match(successJs, /buildSuccessMetaList/);
  assert.match(successJs, /success-contact-note/);
  assert.match(successJs, /publicReceipt/);
  assert.match(successJs, /Private delivery details remain securely with the artist/);
  assert.match(successJs, /For privacy, the full address is shown only immediately after checkout/);
  assert.doesNotMatch(successJs, /alert alert-success/);

  assert.match(css, /\.order-success-page/s);
  assert.match(css, /\.order-success-hero/s);
  assert.match(css, /\.order-success-shell/s);
  assert.match(css, /\.success-receipt-panel/s);
  assert.match(css, /\.success-artwork-card/s);
  assert.match(css, /\.success-status-pill/s);
  assert.match(css, /\.success-next-steps/s);
  assert.match(css, /\.success-privacy-note/s);
  assert.match(css, /@media \(max-width:\s*991px\)[\s\S]*\.order-success-grid/s);
});

test('checkout page carries collector assurance details before payment', () => {
  const checkoutHtml = read('checkout.html');
  const checkoutJs = read('js/checkout.js');
  const configJs = read('js/config.js');
  const css = read('style.css');

  assert.match(checkoutHtml, /body class="bg-body checkout-page"/);
  assert.match(checkoutHtml, /style\.css\?v=premium-checkout-/);
  assert.match(checkoutHtml, /hero-section checkout-hero/);
  assert.match(checkoutHtml, /Complete your acquisition/);
  assert.match(checkoutHtml, /<a href="cart\.html">Cart<\/a>\s*<span aria-hidden="true">&gt;<\/span>\s*<span>Checkout<\/span>/);
  assert.doesNotMatch(checkoutHtml, /aria-hidden="true">\/<\/span>/);
  assert.match(checkoutHtml, /checkout-collector-section/);
  assert.match(checkoutHtml, /checkout-shell/);
  assert.match(checkoutHtml, /checkout-grid/);
  assert.match(checkoutHtml, /href="cart\.html" class="checkout-step-link">Review<\/a>/);
  assert.match(checkoutHtml, /checkout-form-panel/);
  assert.match(checkoutHtml, /checkout-panel-heading/);
  assert.match(checkoutHtml, /checkout-form-section/);
  assert.match(checkoutHtml, /checkout-field-grid/);
  assert.match(checkoutHtml, /checkout-summary-panel/);
  assert.match(checkoutHtml, /checkout-order-card/);
  assert.match(checkoutHtml, /class="checkout-review-return"/);
  assert.match(checkoutHtml, /Back to review/);
  assert.match(checkoutHtml, /checkout-payment-panel/);
  assert.match(checkoutHtml, /checkout-assurance-panel/);
  assert.match(checkoutHtml, /Collector assurance/);
  assert.match(configJs, /https:\/\/api\.sunilsawane\.com\/api/);
  assert.doesNotMatch(configJs, /\.code\.run\/api/);
  assert.doesNotMatch(configJs, /growing-approval-51840080fc\.strapiapp\.com/);
  assert.match(checkoutHtml, /Securely packed for shipping/);
  assert.match(checkoutHtml, /Certificate of authenticity/);
  assert.match(checkoutHtml, /Return &amp; damage support/);
  assert.match(checkoutHtml, /id="shipping-fast"/);
  assert.match(checkoutHtml, /id="gift"/);
  assert.match(checkoutHtml, /id="return"/);
  assert.match(checkoutHtml, /js\/config\.js\?v=api-domain-20260912/);
  assert.match(checkoutHtml, /js\/checkout\.js\?v=collector-flow-20260611a/);
  assert.doesNotMatch(checkoutHtml, /list-group mt-3 mb-4/);
  assert.doesNotMatch(checkoutHtml, /class="cart-totals bg-grey padding-medium"/);

  assert.match(checkoutJs, /checkout-order-items/);
  assert.match(checkoutJs, /checkout-order-item/);
  assert.match(checkoutJs, /checkout-order-price/);
  assert.match(checkoutJs, /animateCheckoutArrivalFromCart/);
  assert.match(checkoutJs, /sunilsawaneCheckoutFlowTransition/);
  assert.match(checkoutJs, /sunilsawaneCheckoutFlowScroll/);
  assert.match(checkoutJs, /history\.scrollRestoration/);
  assert.match(checkoutJs, /checkout-flow-arriving/);
  assert.match(checkoutJs, /scrollTo/);
  assert.match(checkoutJs, /is-arriving-from-cart/);
  assert.match(checkoutJs, /is-advancing-to-details/);
  assert.match(checkoutJs, /Could not reach checkout backend at/);
  assert.match(checkoutJs, /Keep npm run dev running/);
  assert.match(checkoutJs, /data\?\.error\?\.message/);
  assert.doesNotMatch(checkoutJs, /d-flex justify-content-between border-bottom pb-2 mb-2/);

  assert.match(configJs, /localApiBaseUrl\s*=\s*'http:\/\/127\.0\.0\.1:1337\/api'/);
  assert.doesNotMatch(configJs, /apiBaseUrl:\s*isLocalFrontend\s*\?\s*'http:\/\/localhost:1337\/api'/);

  assert.match(css, /\.checkout-page\s+#header\s*\{/s);
  assert.match(css, /\.checkout-hero\.hero-section/s);
  assert.match(css, /\.checkout-hero\.hero-section\s*\{[^}]*text-align:\s*center;/s);
  assert.match(css, /\.checkout-hero-inner\s*\{[^}]*max-width:\s*920px;[^}]*margin:\s*0 auto;/s);
  assert.match(css, /\.checkout-hero-copy\s*\{[^}]*margin:\s*0 auto;/s);
  assert.match(css, /\.checkout-breadcrumbs\s*\{[^}]*justify-content:\s*center;/s);
  assert.match(css, /\.checkout-collector-section/s);
  assert.match(css, /\.checkout-step-link/s);
  assert.match(css, /\.checkout-progress-row\s+\.is-complete/s);
  assert.match(css, /\.checkout-flow-arriving\s+\.checkout-hero-inner/s);
  assert.match(css, /\.checkout-progress-row\.is-advancing-to-details\s+span:nth-child\(2\)::after/s);
  assert.match(css, /\.checkout-grid/s);
  assert.match(css, /\.checkout-form-panel/s);
  assert.match(css, /\.checkout-summary-panel/s);
  assert.match(css, /\.checkout-order-card/s);
  assert.match(css, /\.checkout-review-return/s);
  assert.match(css, /\.checkout-page\s+\.form-control:invalid/s);
  assert.match(css, /\.checkout-page\s+\.form-control:valid/s);
  assert.match(css, /\.checkout-assurance-panel/);
  assert.match(css, /\.checkout-assurance-item/);
  assert.match(css, /\.checkout-assurance-panel\s+h5/);
  assert.match(css, /\.checkout-payment-panel/s);
  assert.match(css, /@media \(max-width:\s*991px\)[\s\S]*\.checkout-grid/s);
});

test('cart page reads as a premium collector review instead of generic cart', () => {
  const cartHtml = read('cart.html');
  const cartJs = read('js/cart.js');
  const css = read('style.css');

  assert.match(cartHtml, /body class="bg-body cart-page"/);
  assert.match(cartHtml, /hero-section checkout-hero cart-flow-hero/);
  assert.match(cartHtml, /Review selected works/);
  assert.match(cartHtml, /<a href="shop\.html">Shop<\/a>\s*<span aria-hidden="true">&gt;<\/span>\s*<span>Cart<\/span>/);
  assert.doesNotMatch(cartHtml, /aria-hidden="true">\/<\/span>/);
  assert.match(cartHtml, /checkout-shell cart-flow-shell/);
  assert.match(cartHtml, /checkout-progress-row cart-flow-progress/);
  assert.match(cartHtml, /<span class="is-current">Review<\/span>/);
  assert.match(cartHtml, /id="cart-checkout-button"/);
  assert.match(cartHtml, /cart-review-section/);
  assert.match(cartHtml, /cart-review-grid/);
  assert.match(cartHtml, /cart-list-panel/);
  assert.match(cartHtml, /cart-summary-panel/);
  assert.match(cartHtml, /Review selected originals/);
  assert.match(cartHtml, /Shipping, authenticity and damage support are confirmed at checkout/);
  assert.match(cartHtml, /style\.css\?v=premium-cart-/);
  assert.doesNotMatch(cartHtml, /<h1 class="display-2 text-uppercase text-dark">Cart<\/h1>/);

  assert.match(cartJs, /premium-cart-item/);
  assert.match(cartJs, /cart-artwork-frame/);
  assert.match(cartJs, /cart-item-edition/);
  assert.match(cartJs, /1 original artwork/);
  assert.match(cartJs, /cart-remove-action/);
  assert.match(cartJs, /cart-summary-note/);
  assert.match(cartJs, /is-advancing-to-details/);
  assert.match(cartJs, /sunilsawaneCheckoutFlowTransition/);
  assert.match(cartJs, /sunilsawaneCheckoutFlowScroll/);
  assert.match(cartJs, /resetCartCheckoutTransition/);
  assert.match(cartJs, /pageshow/);
  assert.match(cartJs, /checkout-flow-leaving/);
  assert.match(cartJs, /prefers-reduced-motion:\s*reduce/);
  assert.match(cartJs, /Opening checkout/);
  assert.match(cartJs, /setTimeout/);
  assert.match(cartJs, /quantity:\s*1/);
  assert.match(cartJs, /image:\s*this\.getImageUrl\(match\)/);
  assert.match(cartJs, /formats\?\.small\?\.url\s*\|\|\s*formats\?\.medium\?\.url/);
  assert.match(cartJs, /decoding:\s*'async'/);
  assert.doesNotMatch(cartJs, /input-group/);
  assert.doesNotMatch(cartJs, /btn-danger/);
  assert.doesNotMatch(cartJs, /updateItemQuantity/);

  assert.match(css, /\.cart-page\s+\.hero-section/);
  assert.match(css, /\.cart-flow-hero/);
  assert.match(css, /\.cart-flow-shell/);
  assert.match(css, /\.cart-flow-progress/);
  assert.match(css, /\.checkout-progress-row\s+span::after/s);
  assert.match(css, /\.cart-flow-progress\.is-advancing-to-details\s+span:nth-child\(2\)::after/s);
  assert.match(css, /\.checkout-flow-leaving\s+\.cart-flow-shell/s);
  assert.match(css, /@supports \(view-transition-name:\s*none\)/s);
  assert.match(css, /@keyframes\s+cart-progress-advance/s);
  assert.match(css, /@keyframes\s+checkout-flow-arrive/s);
  assert.match(css, /\.cart-checkout-button:disabled/s);
  assert.match(css, /\.cart-review-grid/);
  assert.match(css, /\.premium-cart-item/);
  assert.match(css, /\.cart-artwork-frame/);
  assert.match(css, /\.cart-artwork-frame\s*{[^}]*width:\s*100%;/s);
  assert.match(css, /\.cart-artwork-frame\s*{[^}]*max-width:\s*100%;/s);
  assert.match(css, /\.cart-artwork-frame\s*{[^}]*align-self:\s*start;/s);
  assert.match(css, /\.cart-item-edition/);
  assert.match(css, /\.cart-remove-action/);
  assert.match(css, /\.cart-summary-panel/);
  assert.match(css, /\.cart-summary-panel\s*{[^}]*position:\s*sticky;/s);
  assert.match(css, /\.cart-summary-note/);
});

test('commerce header action icons and count badges stay consistent', () => {
  const shopHtml = read('shop.html');
  const cartHtml = read('cart.html');
  const css = read('style.css');
  const headerPages = [
    'index.html',
    'about-us.html',
    'gallery.html',
    'cart.html',
    'checkout.html',
    'artwork-detail.html',
    'order-success.html',
    'contact.html',
  ];

  assert.match(shopHtml, /class="liked-items-count header-action-badge badge bg-danger position-absolute top-0 start-100 translate-middle"/);
  assert.match(shopHtml, /class="cart-count header-action-badge badge bg-danger position-absolute top-0 start-100 translate-middle"/);
  assert.match(shopHtml, /class="bi bi-cart-fill"/);
  assert.doesNotMatch(shopHtml, /class="bi bi-bag-fill"/);
  assert.match(cartHtml, /<li class="nav-action-item cart-nav-item">/);
  assert.match(cartHtml, /class="header-action-link position-relative"/);
  assert.match(cartHtml, /class="cart-count header-action-badge badge bg-danger position-absolute top-0 start-100 translate-middle"/);
  headerPages.forEach((page) => {
    const html = read(page);
    assert.match(html, /class="cart-count header-action-badge badge bg-danger position-absolute top-0 start-100 translate-middle"/, `${page} uses the shared cart count badge`);
    assert.doesNotMatch(html, /font-size:\s*10px/, `${page} does not override badge font sizing inline`);
    assert.match(html, /class="bi bi-cart-fill"/, `${page} uses the preferred cart symbol`);
    assert.doesNotMatch(html, /class="bi bi-bag-fill"/, `${page} does not use the bag symbol for cart`);
  });

  assert.match(css, /\.header-action-badge\s*\{/s);
  assert.match(css, /\.header-action-badge\s*\{[^}]*min-width:\s*18px;/s);
  assert.match(css, /\.header-action-badge\s*\{[^}]*height:\s*18px;/s);
  assert.match(css, /\.header-action-badge\s*\{[^}]*border-radius:\s*5px;/s);
  assert.match(css, /\.header-action-badge\s*\{[^}]*background-color:\s*#de3348\s*!important;/s);
  assert.match(css, /\.header-action-badge\s*\{[^}]*font-size:\s*0\.6rem\s*!important;/s);
  assert.match(css, /\.header-action-badge\s*\{[^}]*transform:\s*translate\(-88%,\s*0\)\s*!important;/s);
  assert.doesNotMatch(shopHtml + cartHtml, /font-size:\s*10px/);
});
