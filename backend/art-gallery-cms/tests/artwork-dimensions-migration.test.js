'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Strapi bootstrap runs the dimensions migration', () => {
  const indexSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.ts'), 'utf8');
  assert.match(indexSource, /require\('\.\/utils\/artwork-dimensions-migration'\)/);
  assert.match(indexSource, /await migrateArtworkDimensions\(strapi\)/);
});

test('All That Breathes dimensions migration updates all 31 artworks once', async () => {
  const {
    DIMENSION_MIGRATION_KEY,
    SERIES_DIMENSIONS,
    migrateArtworkDimensions,
  } = require('../src/utils/artwork-dimensions-migration');

  assert.equal(Object.keys(SERIES_DIMENSIONS).length, 31);

  const records = Object.entries(SERIES_DIMENSIONS).map(([title, dimensions], index) => ({
    id: index + 1,
    documentId: `artwork-${index + 1}`,
    title,
    seriesName: 'All That Breathes',
    dimensions: index === 0 ? dimensions : null,
  }));
  let migrationState = null;
  let updateCalls = 0;

  const strapi = {
    store(options) {
      assert.equal(options.key, DIMENSION_MIGRATION_KEY);
      return {
        async get() { return migrationState; },
        async set({ value }) { migrationState = value; },
      };
    },
    db: {
      query(uid) {
        assert.equal(uid, 'api::artwork.artwork');
        return {
          async findMany() { return records.map((record) => ({ ...record })); },
          async update({ where, data }) {
            updateCalls += 1;
            const record = records.find((item) => item.id === where.id);
            record.dimensions = data.dimensions;
            return { ...record };
          },
        };
      },
    },
    log: { info() {} },
  };

  const first = await migrateArtworkDimensions(strapi);
  assert.equal(first.status, 'completed');
  assert.equal(first.updatedCount, 30);
  assert.equal(updateCalls, 30);
  for (const record of records) {
    assert.equal(record.dimensions, SERIES_DIMENSIONS[record.title]);
  }

  const second = await migrateArtworkDimensions(strapi);
  assert.equal(second.skipped, true);
  assert.equal(updateCalls, 30);
});

test('dimensions migration fails closed when a series artwork is missing', async () => {
  const {
    SERIES_DIMENSIONS,
    migrateArtworkDimensions,
  } = require('../src/utils/artwork-dimensions-migration');
  const titles = Object.keys(SERIES_DIMENSIONS).slice(0, 30);
  const records = titles.map((title, index) => ({
    id: index + 1,
    title,
    seriesName: 'All That Breathes',
    dimensions: null,
  }));
  let updateCalls = 0;

  const strapi = {
    store() {
      return { async get() { return null; }, async set() {} };
    },
    db: {
      query() {
        return {
          async findMany() { return records; },
          async update() { updateCalls += 1; },
        };
      },
    },
    log: { info() {} },
  };

  await assert.rejects(
    migrateArtworkDimensions(strapi),
    /expected 31 matching artworks but found 30/
  );
  assert.equal(updateCalls, 0);
});
