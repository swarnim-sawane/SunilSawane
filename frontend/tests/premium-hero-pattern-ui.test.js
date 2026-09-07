const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const frontendRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(frontendRoot, file), 'utf8');

test('inner page heroes use real artwork texture while home remains image-led', () => {
  const css = read('style.css');

  assert.match(css, /--inner-hero-artwork:\s*url\("images\/gallery-1\.jpg"\);/);
  assert.match(css, /\.about-hero\.hero-section,[\s\S]*\.artwork-detail-hero\s*\{[\s\S]*isolation:\s*isolate;[\s\S]*overflow:\s*hidden;/);
  assert.match(css, /\.about-hero\.hero-section::before,[\s\S]*\.artwork-detail-hero::before\s*\{[\s\S]*background-image:\s*var\(--inner-hero-artwork\);/);
  assert.match(css, /background-position:\s*calc\(50% \+ 390px\)\s+47%;/);
  assert.match(css, /background-size:\s*clamp\(820px,\s*74vw,\s*1420px\)\s+auto;/);
  assert.match(css, /mix-blend-mode:\s*multiply;/);
  assert.match(css, /-webkit-mask-image:\s*radial-gradient\(ellipse at 70% 50%/);
  assert.match(css, /\.about-hero\.hero-section::after,[\s\S]*\.artwork-detail-hero::after\s*\{[\s\S]*repeating-linear-gradient\(0deg,\s*rgba\(33,\s*31,\s*28,\s*0\.01\)/);
  assert.match(css, /\.about-hero-inner,[\s\S]*\.artwork-detail-hero\s+\.container\s*\{[\s\S]*z-index:\s*1;/);
  assert.doesNotMatch(css, /royal-hero-pattern\.svg/);
  assert.doesNotMatch(css, /radial-gradient\(circle at 50% 0/);

  [
    '.about-hero.hero-section::before',
    '.gallery-hero.hero-section::before',
    '.shop-hero.hero-section::before',
    '.checkout-hero.hero-section::before',
    '.contact-hero.hero-section::before',
    '.artwork-detail-hero::before',
  ].forEach((selector) => {
    assert.match(css, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${selector} uses the shared pattern layer`);
  });

  assert.doesNotMatch(css, /\.home-hero\.hero-section::before/);
  assert.doesNotMatch(css, /\.home-hero::before\s*\{/);
});
