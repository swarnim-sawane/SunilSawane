const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const frontendRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(frontendRoot, file), 'utf8');

test('mobile commerce and gallery controls keep accessible touch targets', () => {
  const css = read('style.css');

  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*#header\.site-header\s+\.navbar-toggler\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*#header\.site-header\s+\.offcanvas\s*\{[^}]*height:\s*100dvh\s*!important;[^}]*min-height:\s*100dvh;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*#header\.site-header\s+\.offcanvas-body\s*\{[^}]*overflow-y:\s*auto;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*#header\.site-header\s+\.offcanvas\s+\.btn-close\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.search-box\s+\.search-input\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*100%;[^}]*box-sizing:\s*border-box;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.breadcrumbs\s+a,\s*\.checkout-breadcrumbs\s+a\s*\{[^}]*min-height:\s*44px;[^}]*display:\s*inline-flex;[^}]*align-items:\s*center;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.gallery-filter-dock\s+\.category-buttons\s+\.gallery-filter-button,\s*\.collector-filter-dock\s+\.category-buttons\s+\.shop-filter-button\s*\{[^}]*min-height:\s*44px;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.shop-sort-select\s*\{[^}]*min-height:\s*44px;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.premium-card-icon\.btn-wishlist,\s*\.liked-items-close,\s*\.header-action-link\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*#header\.site-header\s+\.offcanvas\s+\.nav-action-item\s*\{[^}]*justify-content:\s*flex-start;[^}]*width:\s*fit-content;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*#header\.site-header\s+\.offcanvas\s+\.header-action-link\s+svg,\s*#header\.site-header\s+\.offcanvas\s+\.liked-items-toggle\s+svg\s*\{[^}]*width:\s*38px;[^}]*height:\s*38px;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*#header\.site-header\s+\.offcanvas\s+\.cart-nav-item\s*\{[^}]*width:\s*auto;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*#header\.site-header\s+\.offcanvas\s+\.liked-items-nav-item\s*\{[^}]*width:\s*auto;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*#header\.site-header\s+\.offcanvas\s+\.liked-items-nav-item\s+\.liked-items-toggle\s*\{[^}]*color:\s*#787d62;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*#header\.site-header\s+\.offcanvas\s+\.liked-items-nav-item\s+\.liked-items-toggle::after\s*\{[^}]*content:\s*"Liked Items";[^}]*font-size:\s*2em;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*#header\.site-header\s+\.offcanvas\s+\.liked-items-nav-item\s+\.liked-items-toggle\s+svg\s*\{[^}]*display:\s*none;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*#header\.site-header\s+\.offcanvas\s+\.cart-nav-item\s+\.header-action-link\s*\{[^}]*color:\s*#94372b;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*#header\.site-header\s+\.offcanvas\s+\.cart-nav-item\s+\.header-action-link::after\s*\{[^}]*content:\s*"Cart";[^}]*font-size:\s*2em;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*#header\.site-header\s+\.offcanvas\s+\.cart-nav-item\s+\.header-action-link\s+svg\s*\{[^}]*display:\s*none;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.gallery-view-link,\s*\.premium-view-link,\s*\.home-gallery-view,\s*\.home-gallery-link,\s*\.footer-primary-link,\s*\.cart-remove-action,\s*\.cart-continue-link,\s*\.checkout-step-link\s*\{[^}]*min-height:\s*44px;[^}]*display:\s*inline-flex;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.premium-card-title\s+a,\s*\.gallery-card-title\s+a,\s*\.cart-item-title\s+a,\s*\.home-gallery-record-body\s+h3\s+a,\s*\.success-artwork-copy\s+h3\s+a,\s*\.footer-legal-bar\s+a\s*\{[^}]*min-height:\s*44px;[^}]*display:\s*inline-flex;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.premium-add-button\s*\{[^}]*min-height:\s*44px;[^}]*display:\s*inline-flex;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.collector-shop-experience\s+\.premium-add-button\s*\{[^}]*min-height:\s*44px;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.footer-link-column\s+a,\s*\.footer-contact-list\s+a,\s*\.contact-social-row\s+a\s*\{[^}]*min-height:\s*44px;[^}]*display:\s*inline-flex;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.contact-detail-link\s*\{[^}]*min-height:\s*44px;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.checkout-payment-option\s*\{[^}]*min-height:\s*56px;/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.checkout-payment-option\s+\.form-check-input\s*\{[^}]*width:\s*22px;[^}]*height:\s*22px;/s);
});

test('mobile forms request the right virtual keyboards', () => {
  const checkoutHtml = read('checkout.html');
  const contactHtml = read('contact.html');
  const detailHtml = read('artwork-detail.html');

  assert.match(checkoutHtml, /id="phone"[\s\S]{0,180}inputmode="tel"/);
  assert.match(checkoutHtml, /id="zipcode"[\s\S]{0,180}inputmode="numeric"/);
  assert.match(contactHtml, /id="contact-phone"[\s\S]{0,180}inputmode="tel"/);
  assert.match(detailHtml, /id="collector-phone"[\s\S]{0,180}inputmode="tel"/);
});
