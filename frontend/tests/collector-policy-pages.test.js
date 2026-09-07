const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const frontendRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(frontendRoot, file), 'utf8');

const policyPages = [
  {
    file: 'shipping-policy.html',
    title: 'Shipping &amp; Delivery',
    requiredCopy: 'Artwork is packed only after the order is confirmed',
  },
  {
    file: 'returns-damage-policy.html',
    title: 'Returns &amp; Damage Support',
    requiredCopy: 'Photograph the package before opening it',
  },
  {
    file: 'authenticity-policy.html',
    title: 'Authenticity',
    requiredCopy: 'Each original artwork is sold as a work by Sunil A. Sawane',
  },
  {
    file: 'privacy-policy.html',
    title: 'Privacy Policy',
    requiredCopy: 'collector details are used only to respond',
  },
  {
    file: 'terms.html',
    title: 'Terms of Purchase',
    requiredCopy: 'placing an order confirms your intent to acquire',
  },
];

test('collector policy pages exist and use the premium policy layout', () => {
  const css = read('style.css');

  assert.match(css, /\.policy-page\s*\{/s);
  assert.match(css, /\.policy-hero\.hero-section\s*\{/s);
  assert.match(css, /\.policy-content-grid\s*\{/s);
  assert.match(css, /\.policy-card\s*\{/s);

  for (const page of policyPages) {
    const html = read(page.file);
    assert.match(html, new RegExp(`<title>${page.title} \\| Sunil Sawane</title>`), `${page.file} has a clear title`);
    assert.match(html, /<body class="policy-page bg-body">/, `${page.file} uses the policy page body class`);
    assert.match(html, /<header id="header" class="site-header text-black">/, `${page.file} includes the shared header`);
    assert.match(html, /class="policy-hero hero-section"/, `${page.file} uses the policy hero`);
    assert.match(html, /class="policy-content-grid"/, `${page.file} uses the policy content grid`);
    assert.match(html, /<footer id="footer" class="gallery-footer overflow-hidden">/, `${page.file} includes the premium footer`);
    assert.match(html, new RegExp(page.requiredCopy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${page.file} includes the expected collector copy`);
    assert.match(html, /href="mailto:sunilsawaneart@gmail\.com"/, `${page.file} gives collectors a direct email route`);
    assert.doesNotMatch(html, /studio/i, `${page.file} avoids studio language`);
  }
});

test('footer and checkout route collector policy links to dedicated pages', () => {
  const pagesWithFooter = [
    'index.html',
    'about-us.html',
    'gallery.html',
    'shop.html',
    'cart.html',
    'checkout.html',
    'artwork-detail.html',
    'order-success.html',
    'contact.html',
    ...policyPages.map((page) => page.file),
  ];

  for (const page of pagesWithFooter) {
    const html = read(page);
    assert.match(html, /href="shipping-policy\.html">Shipping &amp; Delivery<\/a>/, `${page} links shipping policy`);
    assert.match(html, /href="returns-damage-policy\.html">Returns &amp; Damage<\/a>/, `${page} links returns and damage policy`);
    assert.match(html, /href="authenticity-policy\.html">Authenticity<\/a>/, `${page} links authenticity policy`);
    assert.match(html, /href="privacy-policy\.html">Privacy<\/a>/, `${page} links privacy policy`);
    assert.match(html, /href="terms\.html">Terms<\/a>/, `${page} links terms`);
  }

  const checkoutHtml = read('checkout.html');
  assert.match(checkoutHtml, /href="shipping-policy\.html" class="checkout-assurance-link">Shipping details<\/a>/);
  assert.match(checkoutHtml, /href="authenticity-policy\.html" class="checkout-assurance-link">Authenticity note<\/a>/);
  assert.match(checkoutHtml, /href="returns-damage-policy\.html" class="checkout-assurance-link">Damage support<\/a>/);

  const componentsJs = read('js/components.js');
  assert.match(componentsJs, /shipping-policy\.html/);
  assert.match(componentsJs, /returns-damage-policy\.html/);
  assert.match(componentsJs, /authenticity-policy\.html/);
  assert.match(componentsJs, /privacy-policy\.html/);
  assert.match(componentsJs, /terms\.html/);
});
