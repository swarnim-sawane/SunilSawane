const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const frontendRoot = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(frontendRoot)
  .filter((file) => file.endsWith('.html'))
  .sort();

test('all static html routes have document identity and no broken local page links', () => {
  const htmlSet = new Set(htmlFiles);
  const expectedRoutes = [
    'index.html',
    'gallery.html',
    'shop.html',
    'cart.html',
    'checkout.html',
    'shipping-policy.html',
    'returns-damage-policy.html',
    'authenticity-policy.html',
    'privacy-policy.html',
    'terms.html',
  ];

  for (const route of expectedRoutes) {
    assert.ok(htmlSet.has(route), `${route} should exist`);
  }

  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(frontendRoot, file), 'utf8');
    const activeHtml = html.replace(/<!--[\s\S]*?-->/g, '');
    assert.match(html, /<title>[^<]+<\/title>/, `${file} should have a title`);
    assert.match(html, /<meta name="viewport"/, `${file} should be mobile-ready`);

    const hrefs = Array.from(activeHtml.matchAll(/\shref="([^"]+)"/g), (match) => match[1]);
    for (const href of hrefs) {
      if (/^(https?:|mailto:|tel:|#|javascript:)/.test(href)) {
        continue;
      }

      const localPath = href.split('#')[0].split('?')[0];
      if (!localPath || localPath.includes('/') || path.extname(localPath) !== '.html') {
        continue;
      }

      assert.ok(htmlSet.has(localPath), `${file} links to missing local route ${localPath}`);
    }
  }
});
