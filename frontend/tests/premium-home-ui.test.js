const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const frontendRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(frontendRoot, file), 'utf8');

test('homepage opens with a creative premium artist arrival', () => {
  const html = read('index.html');
  const css = read('style.css');

  assert.match(html, /<body class="home-page bg-body"/);
  assert.match(html, /<section id="billboard" class="home-hero overflow-hidden"/);
  assert.match(html, /home-hero-media/);
  assert.match(html, /<img src="images\/Hero-image-1200\.webp"/);
  assert.match(html, /<h1 class="home-hero-title">Sunil A\. Sawane<\/h1>/);
  assert.match(html, /Original pen, ink, and color works shaped by nature, movement, and 45 years of disciplined observation\./);
  assert.match(html, /class="home-primary-action" href="gallery\.html">View Gallery<\/a>/);
  assert.match(html, /class="home-secondary-action" href="shop\.html">Shop Originals<\/a>/);
  assert.doesNotMatch(html, /home-scroll-cue/);
  assert.doesNotMatch(html, /swiper-button-next/);
  assert.doesNotMatch(html, /swiper-button-prev/);
  assert.doesNotMatch(html, /swiper-pagination position-absolute/);
  assert.doesNotMatch(html, /swiper-bundle(?:\.min)?\.(?:css|js)/);
  assert.doesNotMatch(html, /Crafting timeless beauty through every brushstroke/);

  assert.match(html, /<section id="company-services" class="home-proof-strip"/);
  assert.match(html, /class="home-proof-grid"/);
  assert.match(html, /<span class="home-proof-value">45\+<\/span>/);
  assert.match(html, /<span class="home-proof-label">Years of practice<\/span>/);
  assert.match(html, /<span class="home-proof-value">15\+<\/span>/);
  assert.match(html, /<span class="home-proof-label">Exhibitions &amp; shows<\/span>/);
  assert.doesNotMatch(html, /class="icon-box/);

  assert.match(css, /\.home-page\s+#header\s*\{/s);
  assert.match(css, /\.home-page\s+#header\s*\{[^}]*position:\s*fixed;/s);
  assert.match(css, /\.home-page\s+#header\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.58\);/s);
  assert.match(css, /\.home-page\s+#header\s*\{[^}]*backdrop-filter:\s*blur\(22px\)\s*saturate\(1\.18\);/s);
  assert.match(css, /\.home-page\s+#header\s+\.logo\s*\{[^}]*object-fit:\s*contain;/s);
  assert.match(css, /\.home-page\s+#header-nav\s*\{[^}]*min-height:\s*78px;/s);
  assert.match(css, /\.home-hero\s*\{[^}]*min-height:\s*clamp\(590px,\s*76svh,\s*780px\);/s);
  assert.match(css, /@media only screen and \(min-width:\s*1600px\)[\s\S]*\.home-hero\s*\{[^}]*min-height:\s*clamp\(630px,\s*70svh,\s*790px\);/s);
  assert.doesNotMatch(css, /\.home-hero::before\s*\{/s);
  assert.match(css, /\.home-hero-media\s*\{/s);
  assert.match(css, /\.home-hero-image\s*\{[^}]*object-fit:\s*cover;/s);
  assert.match(css, /\.home-hero-title\s*\{/s);
  assert.match(css, /\.home-hero-actions\s*\{/s);
  assert.match(css, /\.home-primary-action/s);
  assert.match(css, /\.home-secondary-action/s);
  assert.match(css, /\.home-proof-strip\s*\{/s);
  assert.match(css, /\.home-proof-grid\s*\{/s);
  assert.doesNotMatch(css, /\.home-scroll-cue\s*\{/);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.home-hero/s);
});

test('homepage serves right-sized images and defers content below the fold', () => {
  const html = read('index.html');
  const optimizedImages = [
    'images/Hero-image-800.webp',
    'images/Hero-image-1200.webp',
    'images/Hero-image-1600.webp',
    'images/Artist-img-600.webp',
    'images/Artist-img-1000.webp',
    'images/gallery-1-600.webp',
    'images/gallery-1-1000.webp',
    'images/gallery-2-600.webp',
    'images/gallery-2-1000.webp'
  ];

  optimizedImages.forEach((image) => {
    assert.ok(fs.existsSync(path.join(frontendRoot, image)), `${image} exists`);
  });

  assert.match(html, /Hero-image-800\.webp 800w,[\s\S]{0,80}Hero-image-1200\.webp 1200w,[\s\S]{0,80}Hero-image-1600\.webp 1600w/);
  assert.match(html, /class="home-hero-image"[\s\S]{0,100}decoding="async"[\s\S]{0,100}fetchpriority="high"/);
  assert.match(html, /Artist-img-600\.webp 600w,[\s\S]{0,80}Artist-img-1000\.webp 1000w/);
  assert.match(html, /class="artist-portrait-image"[\s\S]{0,100}loading="lazy"[\s\S]{0,100}decoding="async"/);
  assert.match(html, /gallery-1-600\.webp 600w,[\s\S]{0,80}gallery-1-1000\.webp 1000w/);
  assert.match(html, /gallery-2-600\.webp 600w,[\s\S]{0,80}gallery-2-1000\.webp 1000w/);
});

test('homepage lower sections feel attached, editorial, and collector-ready', () => {
  const html = read('index.html');
  const css = read('style.css');
  const scriptJs = read('js/script.js');
  const aboutSection = html.match(/<section id="about-us"[\s\S]*?<\/section>/)?.[0] || '';
  const gallerySection = html.match(/<section id="collections"[\s\S]*?<\/section>/)?.[0] || '';
  const contactSection = html.match(/<section class="home-contact-section"[\s\S]*?<\/section>/)?.[0] || '';

  assert.match(aboutSection, /artist-portrait-card/);
  assert.match(aboutSection, /artist-portrait-frame/);
  assert.match(aboutSection, /artist-quote-panel/);
  assert.match(aboutSection, /artist-quote-mark/);
  assert.match(aboutSection, /All creativity is a gift from God/);
  assert.doesNotMatch(aboutSection, /style="padding-left/);

  assert.match(gallerySection, /home-gallery-preview/);
  assert.match(gallerySection, /home-gallery-header/);
  assert.match(gallerySection, /home-gallery-grid/);
  assert.match(gallerySection, /home-gallery-record/);
  assert.match(gallerySection, /home-gallery-art-frame/);
  assert.match(gallerySection, /home-gallery-record-note/);
  assert.doesNotMatch(gallerySection, /collection-swiper/);
  assert.doesNotMatch(gallerySection, /swiper-slide/);
  assert.doesNotMatch(gallerySection, /box-slide/);

  assert.match(contactSection, /home-contact-grid/);
  assert.match(contactSection, /home-contact-card/);
  assert.match(contactSection, /home-contact-methods/);
  assert.match(contactSection, /home-contact-note/);
  assert.match(contactSection, /artwork conversations/);
  assert.match(contactSection, /mailto:sunilsawaneart@gmail\.com/);
  assert.match(contactSection, /tel:\+919810238984/);
  assert.match(contactSection, /name="email"/);
  assert.doesNotMatch(contactSection, /subscribe-content padding-large/);
  assert.doesNotMatch(contactSection, /studio|Studio|STUDIO/);

  assert.doesNotMatch(html, /new Swiper\('\.collection-swiper'/);

  assert.match(css, /\.artist-portrait-card\s*\{/s);
  assert.match(css, /--artist-card-lift/);
  assert.match(css, /--artist-image-drift/);
  assert.match(css, /--artist-quote-drift/);
  assert.match(scriptJs, /initArtistPortraitMotion/);
  assert.match(scriptJs, /prefers-reduced-motion:\s*reduce/);
  assert.match(scriptJs, /requestAnimationFrame\(setDrift\)/);
  assert.match(css, /\.artist-quote-panel\s*\{/s);
  assert.match(css, /\.home-gallery-preview\s*\{/s);
  assert.match(css, /\.home-gallery-grid\s*\{/s);
  assert.match(css, /\.home-gallery-record\s*\{/s);
  assert.match(css, /\.home-gallery-art-frame\s*\{/s);
  assert.match(css, /\.home-contact-section\s*\{/s);
  assert.match(css, /\.home-contact-grid\s*\{/s);
  assert.match(css, /\.home-contact-card\s*\{/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.home-gallery-record/s);
});
