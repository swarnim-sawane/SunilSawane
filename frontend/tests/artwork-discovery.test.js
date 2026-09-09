const assert = require('node:assert/strict');
const test = require('node:test');

const discovery = require('../js/artwork-discovery');

const artworks = [
  {
    id: 1,
    title: 'Monsoon Courtyard',
    Description: [{ children: [{ text: 'Rain gathers around a quiet doorway.' }] }],
    medium: 'Pen and ink',
    yearCreated: 2024,
    isFeatured: true,
    category: { slug: 'pen-ink', Name: 'Pen & Ink' },
  },
  {
    id: 2,
    title: 'River Memory',
    Description: 'A landscape held between water and sky.',
    medium: 'Mixed media',
    yearCreated: 2023,
    isFeatured: false,
    category: { slug: 'mixed-media', Name: 'Mixed Media' },
  },
];

test('removes categories that have no artwork in the loaded catalogue', () => {
  const categories = [
    { slug: 'pen-ink', Name: 'Pen & Ink' },
    { slug: 'mixed-media', Name: 'Mixed Media' },
    { slug: 'watercolour', Name: 'Watercolour' },
  ];

  assert.deepEqual(
    discovery.getPopulatedCategories(categories, artworks).map((category) => category.slug),
    ['pen-ink', 'mixed-media']
  );
});

test('searches title, description, medium, category, and year case-insensitively', () => {
  assert.deepEqual(discovery.filterArtworks(artworks, { query: 'MONSOON' }).map((art) => art.id), [1]);
  assert.deepEqual(discovery.filterArtworks(artworks, { query: 'quiet doorway' }).map((art) => art.id), [1]);
  assert.deepEqual(discovery.filterArtworks(artworks, { query: 'mixed media' }).map((art) => art.id), [2]);
  assert.deepEqual(discovery.filterArtworks(artworks, { query: '2023' }).map((art) => art.id), [2]);
});

test('combines category and search filters without mutating the catalogue', () => {
  const original = [...artworks];
  const result = discovery.filterArtworks(artworks, {
    categorySlug: 'pen-ink',
    query: 'rain',
  });

  assert.deepEqual(result.map((art) => art.id), [1]);
  assert.deepEqual(artworks, original);
});

test('recognizes the existing Strapi featured flag', () => {
  assert.equal(discovery.isFeaturedArtwork(artworks[0]), true);
  assert.equal(discovery.isFeaturedArtwork(artworks[1]), false);
  assert.equal(discovery.isFeaturedArtwork({ isFeatured: 'true' }), true);
});
