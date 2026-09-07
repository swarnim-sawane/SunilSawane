const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const frontendRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(frontendRoot, file), 'utf8');

test('site header uses one shared glassmorphic height contract across pages', () => {
  const css = read('style.css');

  assert.match(css, /--site-header-height:\s*78px;/);
  assert.match(css, /--site-header-logo-height:\s*64px;/);
  assert.match(css, /--site-header-clearance:\s*86px;/);
  assert.match(css, /body\s*\{[^}]*padding-top:\s*var\(--site-header-height\)\s*!important;/s);
  assert.match(css, /body\.home-page,[^}]*body\.contact-page\s*\{[^}]*padding-top:\s*var\(--site-header-height\)\s*!important;/s);
  assert.match(css, /\.shop-page,\s*\.gallery-page\s*\{[^}]*--shop-header-clearance:\s*var\(--site-header-clearance\);[^}]*--gallery-header-clearance:\s*var\(--site-header-clearance\);/s);
  assert.match(css, /#header\.site-header\s*\{[^}]*position:\s*fixed;[^}]*min-height:\s*var\(--site-header-height\);/s);
  assert.match(css, /#header\.site-header\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.58\);/s);
  assert.match(css, /#header\.site-header\s*\{[^}]*box-shadow:\s*0 18px 46px rgba\(33,\s*31,\s*28,\s*0\.055\);/s);
  assert.match(css, /#header\.site-header\s*\{[^}]*backdrop-filter:\s*blur\(22px\)\s*saturate\(1\.18\);/s);
  assert.match(css, /#header\.site-header\s+#header-nav\s*\{[^}]*min-height:\s*var\(--site-header-height\);[^}]*margin-bottom:\s*0\s*!important;/s);
  assert.match(css, /#header\.site-header\s+\.logo\s*\{[^}]*max-height:\s*var\(--site-header-logo-height\);/s);

  [
    'index.html',
    'about-us.html',
    'gallery.html',
    'shop.html',
    'cart.html',
    'checkout.html',
    'contact.html',
    'artwork-detail.html',
    'order-success.html',
  ].forEach((page) => {
    const html = read(page);
    assert.match(html, /<header id="header" class="site-header text-black">/, `${page} uses the shared header hook`);
    assert.match(html, /<nav id="header-nav" class="navbar navbar-expand-lg px-3 mb-3">/, `${page} uses the shared nav hook`);
  });
});
