const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const frontendRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(frontendRoot, file), 'utf8');

test('artwork detail offers a premium collector enquiry drawer', () => {
  const detailHtml = read('artwork-detail.html');
  const detailJs = read('js/artwork-detail.js');
  const css = read('style.css');

  assert.match(detailHtml, /id="collector-enquiry-open"/);
  assert.match(detailHtml, /Enquire \/ Reserve/);
  assert.match(detailHtml, /collector-enquiry-drawer/);
  assert.match(detailHtml, /role="dialog"/);
  assert.match(detailHtml, /aria-modal="true"/);
  assert.match(detailHtml, /id="collector-enquiry-form"/);
  assert.match(detailHtml, /action="https:\/\/formspree\.io\/f\/mpwabwzz"/);
  assert.match(detailHtml, /name="artwork_title"/);
  assert.match(detailHtml, /name="artwork_url"/);
  assert.match(detailHtml, /label for="collector-name"/);
  assert.match(detailHtml, /label for="collector-contact"/);
  assert.match(detailHtml, /label for="collector-city"/);
  assert.match(detailHtml, /label for="collector-message"/);
  assert.match(detailHtml, /aria-live="polite"/);
  assert.doesNotMatch(detailHtml, /I would like framing\/shipping details/);

  assert.match(detailJs, /function openCollectorEnquiry/);
  assert.match(detailJs, /function closeCollectorEnquiry/);
  assert.match(detailJs, /function populateCollectorEnquiry/);
  assert.match(detailJs, /function submitCollectorEnquiry/);
  assert.match(detailJs, /fetch\(form\.action/);
  assert.match(detailJs, /collector-enquiry-open/);
  assert.match(detailJs, /collector-enquiry-form/);
  assert.match(detailJs, /collector-enquiry-status/);
  assert.match(detailJs, /Enquiry received/);
  assert.match(detailJs, /artworkAvailability\.getUnavailableMessage/);
  assert.match(detailJs, /artworkAvailability\.getEnquiryLabel/);
  assert.match(detailJs, /artworkAvailability\.getEnquiryPrompt/);
  assert.match(detailJs, /body\.classList\.add\('collector-enquiry-active'\)/);
  assert.match(detailJs, /body\.classList\.remove\('collector-enquiry-active'\)/);
  assert.doesNotMatch(detailJs, /innerHTML\s*=\s*`/);

  assert.match(css, /\.collector-enquiry-drawer/);
  assert.match(css, /\.collector-enquiry-drawer\.is-open/);
  assert.match(css, /\.collector-enquiry-backdrop/);
  assert.match(css, /\.collector-enquiry-panel/);
  assert.match(css, /\.collector-enquiry-form/);
  assert.match(css, /\.collector-enquiry-status/);
  assert.match(css, /\.collector-enquiry-active/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*\.collector-enquiry-panel/s);
});

test('browsing surfaces communicate unavailable works without purchase affordances', () => {
  const shopHtml = read('shop.html');
  const galleryHtml = read('gallery.html');
  const shopJs = read('js/shop.js');
  const galleryJs = read('js/gallery.js');
  const css = read('style.css');

  assert.match(shopHtml, /js\/artwork-availability\.js/);
  assert.match(galleryHtml, /js\/artwork-availability\.js/);
  assert.match(shopJs, /shopArtworkAvailability\.getStatus/);
  assert.match(shopJs, /shopArtworkAvailability\.getStatusLabel/);
  assert.match(shopJs, /premium-availability-tag/);
  assert.match(shopJs, /is-unavailable/);

  assert.match(galleryJs, /galleryArtworkAvailability\.getStatus/);
  assert.match(galleryJs, /function createGalleryStatusPill/);
  assert.match(galleryJs, /gallery-status-pill/);
  assert.match(galleryJs, /is-unavailable/);

  assert.match(css, /\.gallery-status-pill/);
  assert.match(css, /\.gallery-artwork-card\.is-unavailable/);
  assert.match(css, /\.premium-availability-tag/);
  assert.match(css, /\.collector-shop-experience\s+\.premium-product-card\.is-unavailable/s);
});

test('cart refreshes artwork availability and blocks checkout for unavailable works', () => {
  const cartHtml = read('cart.html');
  const cartJs = read('js/cart.js');
  const checkoutJs = read('js/checkout.js');
  const css = read('style.css');

  assert.match(cartHtml, /js\/api\.js/);

  assert.match(cartJs, /async refreshAvailability/);
  assert.match(cartJs, /function isCartItemUnavailable/);
  assert.match(cartJs, /function cartHasUnavailableItems/);
  assert.match(cartJs, /function updateCheckoutAvailabilityState/);
  assert.match(cartJs, /cart-item-unavailable/);
  assert.match(cartJs, /cartArtworkAvailability\.getUnavailableMessage/);
  assert.match(cartJs, /Remove unavailable work before checkout/);
  assert.match(cartJs, /artAPI\.fetchArtworks/);
  assert.match(cartJs, /availabilityStatus/);
  assert.match(cartJs, /id:\s*match\.id\s*\|\|\s*item\.id/);

  assert.match(checkoutJs, /cart\.refreshAvailability/);
  assert.match(checkoutJs, /cartHasUnavailableItems/);
  assert.match(checkoutJs, /Please return to cart and remove unavailable works/);

  assert.match(css, /\.premium-cart-item\.cart-item-unavailable/);
  assert.match(css, /\.cart-item-status/);
  assert.match(css, /\.cart-checkout-button:disabled/s);
});
