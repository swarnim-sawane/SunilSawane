const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const frontendRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(frontendRoot, file), 'utf8');

test('about page reads as a premium collector-facing artist profile', () => {
  const html = read('about-us.html');
  const css = read('style.css');
  const aboutIdMatches = html.match(/id="about-us"/g) || [];

  assert.match(html, /<body class="about-page bg-body"/);
  assert.match(html, /style\.css\?v=premium-about-/);
  assert.match(html, /hero-section about-hero/);
  assert.match(html, /about-hero-kicker/);
  assert.match(html, /<h1 class="about-hero-title">Sunil A\. Sawane<\/h1>/);
  assert.match(html, /A life in primary color, disciplined observation, and original works shaped over 45 years\./);
  assert.match(html, /aria-label="About path"/);
  assert.match(html, /<a href="index\.html">Home<\/a>\s*<span aria-hidden="true">&gt;<\/span>\s*<span>About<\/span>/);

  assert.equal(aboutIdMatches.length, 1);
  assert.match(html, /<section id="about-us" class="about-profile-section"/);
  assert.match(html, /about-profile-grid/);
  assert.match(html, /about-portrait-card/);
  assert.match(html, /about-portrait-frame/);
  assert.match(html, /about-quote-card/);
  assert.match(html, /about-quote-mark/);
  assert.match(html, /All creativity is a gift from God/);
  assert.doesNotMatch(html, /style="width:\s*100%;\s*height:\s*auto;"/);

  assert.match(html, /about-story-section/);
  assert.match(html, /about-story-grid/);
  assert.match(html, /about-story-copy/);
  assert.match(html, /about-timeline/);
  assert.match(html, /formal recognition of craft and commitment/);
  assert.match(html, /collector-facing practice/);
  assert.match(html, /Contact the Artist/);
  assert.doesNotMatch(html, /studio|Studio|STUDIO/);
  assert.match(html, /<h2>My Artistry<\/h2>/);
  assert.doesNotMatch(html, /My Atistry/);
  assert.doesNotMatch(html, /class="text-center"[\s\S]{0,1600}<p class="lead">/);
  assert.doesNotMatch(html, /elementor-widget-container/);

  assert.match(html, /about-proof-band/);
  assert.match(html, /about-proof-grid/);
  assert.match(html, /about-proof-value">45\+<\/span>/);
  assert.match(html, /about-proof-value">120\+<\/span>/);

  assert.match(html, /about-contact-section/);
  assert.match(html, /about-contact-panel/);
  assert.match(html, /For acquisitions, commissions, and private viewing enquiries/);
  assert.match(html, /href="mailto:sunilsawaneart@gmail\.com"/);
  assert.match(html, /href="tel:\+919810238984"/);

  assert.match(css, /\.about-page\s+#header\s*\{/s);
  assert.match(css, /\.about-hero\.hero-section\s*\{/s);
  assert.match(css, /\.about-profile-section\s*\{/s);
  assert.match(css, /\.about-profile-grid\s*\{/s);
  assert.match(css, /\.about-portrait-card\s*\{/s);
  assert.match(css, /\.about-quote-card\s*\{/s);
  assert.match(css, /\.about-story-grid\s*\{/s);
  assert.match(css, /\.about-story-copy\s+p\s*\{[^}]*text-align:\s*left;/s);
  assert.match(css, /\.about-timeline\s*\{/s);
  assert.match(css, /\.about-proof-band\s*\{/s);
  assert.match(css, /\.about-contact-panel\s*\{/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.about-profile-grid/s);
});
