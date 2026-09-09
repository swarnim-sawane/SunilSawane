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
    seriesName: 'Garden of Kinship',
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
  assert.deepEqual(discovery.filterArtworks(artworks, { query: 'garden of kinship' }).map((art) => art.id), [1]);
});

test('normalizes optional series names without assigning a series to ordinary artworks', () => {
  assert.equal(discovery.getArtworkSeriesName(artworks[0]), 'Garden of Kinship');
  assert.equal(discovery.getArtworkSeriesName({ seriesName: '  Quiet Forms  ' }), 'Quiet Forms');
  assert.equal(discovery.getArtworkSeriesName(artworks[1]), '');
  assert.equal(discovery.isSeriesArtwork(artworks[0]), true);
  assert.equal(discovery.isSeriesArtwork(artworks[1]), false);
});

test('discovers populated series and filters an exact series alongside search', () => {
  const catalogue = [
    ...artworks,
    {
      id: 3,
      title: 'Wild Kin',
      Description: 'A shared breath between figure and forest.',
      seriesName: 'Garden of Kinship',
      category: { slug: 'pen-ink', Name: 'Pen & Ink' },
    },
    {
      id: 4,
      title: 'Other Breath',
      seriesName: 'All That Breathes',
      category: { slug: 'pen-ink', Name: 'Pen & Ink' },
    },
  ];

  assert.deepEqual(discovery.getPopulatedSeries(catalogue), [
    { name: 'Garden of Kinship', count: 2 },
    { name: 'All That Breathes', count: 1 },
  ]);
  assert.deepEqual(
    discovery.filterArtworks(catalogue, {
      seriesName: 'garden of kinship',
      query: 'wild',
    }).map((art) => art.id),
    [3]
  );
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
