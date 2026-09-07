const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const frontendRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(frontendRoot, file), 'utf8');

test('site footer is a restrained premium gallery footer', () => {
  const css = read('style.css');
  const componentsJs = read('js/components.js');
  const pages = [
    'index.html',
    'about-us.html',
    'gallery.html',
    'shop.html',
    'cart.html',
    'checkout.html',
    'artwork-detail.html',
    'order-success.html',
    'contact.html',
  ];

  for (const page of pages) {
    const html = read(page);
    assert.match(html, /<footer id="footer" class="gallery-footer overflow-hidden">/, `${page} uses the premium footer shell`);
    assert.match(html, /class="footer-brand-note"/, `${page} keeps the brand note compact`);
    assert.match(html, /class="footer-link-column footer-commerce-links"/, `${page} includes collector support links`);
    assert.match(html, /href="shop\.html">Shop<\/a>/, `${page} exposes Shop in the footer`);
    assert.match(html, /href="cart\.html">Cart<\/a>/, `${page} exposes Cart in the footer`);
    assert.match(html, /href="shipping-policy\.html">Shipping &amp; Delivery<\/a>/, `${page} exposes shipping policy`);
    assert.match(html, /href="returns-damage-policy\.html">Returns &amp; Damage<\/a>/, `${page} exposes returns support`);
    assert.match(html, /href="authenticity-policy\.html">Authenticity<\/a>/, `${page} exposes authenticity details`);
    assert.match(html, /href="privacy-policy\.html">Privacy<\/a>/, `${page} exposes privacy details`);
    assert.match(html, /href="terms\.html">Terms<\/a>/, `${page} exposes purchase terms`);
    assert.match(html, /href="tel:\+919810238984"/, `${page} has a callable phone link`);
    assert.match(html, /href="mailto:sunilsawaneart@gmail\.com"/, `${page} has a mail link`);
    assert.match(html, /class="footer-legal-bar"/, `${page} separates legal text from navigation`);
    assert.doesNotMatch(html, /Unauthorized use or reproduction/, `${page} does not carry the long legal paragraph in the footer body`);
  }

  assert.match(componentsJs, /gallery-footer overflow-hidden/);
  assert.match(componentsJs, /footer-commerce-links/);
  assert.match(componentsJs, /shipping-policy\.html/);
  assert.match(componentsJs, /returns-damage-policy\.html/);
  assert.match(componentsJs, /authenticity-policy\.html/);
  assert.match(componentsJs, /privacy-policy\.html/);
  assert.match(componentsJs, /terms\.html/);
  assert.match(componentsJs, /tel:\+919810238984/);
  assert.doesNotMatch(componentsJs, /Unauthorized use or reproduction/);

  assert.match(css, /\.gallery-footer\s*\{/s);
  assert.match(css, /\.gallery-footer-grid\s*\{/s);
  assert.match(css, /\.footer-brand-note\s*\{[^}]*max-width:\s*28rem;/s);
  assert.match(css, /\.footer-link-column\s+a:hover/s);
  assert.match(css, /\.footer-contact-list\s+a/s);
  assert.match(css, /\.footer-legal-bar\s*\{/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.gallery-footer-grid/s);
});
