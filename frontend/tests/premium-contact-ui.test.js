const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const frontendRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(frontendRoot, file), 'utf8');

test('contact page matches the premium collector-facing system', () => {
  const html = read('contact.html');
  const css = read('style.css');
  const contactJs = read('js/contact.js');

  assert.match(html, /<body class="contact-page bg-body"/);
  assert.match(html, /style\.css\?v=premium-contact-/);
  assert.match(html, /hero-section contact-hero/);
  assert.match(html, /Collector inquiries/);
  assert.match(html, /For acquisitions, commissions, artwork availability, shipping, or artwork conversations/);
  assert.match(html, /aria-label="Contact path"/);
  assert.match(html, /<a href="index\.html">Home<\/a>\s*<span aria-hidden="true">&gt;<\/span>\s*<span>Contact<\/span>/);

  assert.match(html, /contact-page-section/);
  assert.match(html, /contact-page-grid/);
  assert.match(html, /contact-info-panel/);
  assert.match(html, /Speak with the artist/);
  assert.match(html, /contact-detail-list/);
  assert.match(html, /href="mailto:sunilsawaneart@gmail\.com"/);
  assert.match(html, /href="tel:\+919810238984"/);
  assert.match(html, /contact-social-row/);
  assert.match(html, /contact-form-panel/);
  assert.match(html, /id="inquiry-form"/);
  assert.match(html, /id="email-field"/);
  assert.match(html, /contact-submit-button/);
  assert.doesNotMatch(html, /contact-us-wrap/);
  assert.doesNotMatch(html, /Got Any Questions/);
  assert.doesNotMatch(html, /Contact Information/);
  assert.doesNotMatch(html, /studio|Studio|STUDIO/);

  assert.match(css, /\.contact-page\s+#header\s*\{/s);
  assert.match(css, /\.contact-hero\.hero-section\s*\{[^}]*text-align:\s*center;/s);
  assert.match(css, /\.contact-page-grid\s*\{[^}]*display:\s*grid;/s);
  assert.match(css, /\.contact-info-panel,\s*\.contact-form-panel\s*\{/s);
  assert.match(css, /\.contact-page\s+\.form-control:invalid/s);
  assert.match(css, /\.contact-page\s+\.form-control:valid/s);
  assert.match(css, /\.contact-submit-button\s*\{/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.contact-field-grid/s);

  assert.match(contactJs, /const inquiryForm = document\.getElementById\('inquiry-form'\)/);
  assert.match(contactJs, /if \(inquiryForm\)/);
  assert.match(contactJs, /queryParams\.email && emailField/);
});
