'use strict';

const ARTWORK_UID = 'api::artwork.artwork';
const DIMENSION_MIGRATION_KEY = 'all-that-breathes-dimensions-v1';
const SERIES_NAME = 'All That Breathes';

const SERIES_DIMENSIONS = Object.freeze({
  'In the Arms of the Wild': '13 x 16.5 in',
  'The Fruit Between Us': '14 x 19 in',
  'The Listening Vessel': '14 x 19 in',
  'Dream Beneath the Flowering Tree': '12 x 16 in',
  'A Meadow of Dreamers': '12 x 16.5 in',
  'The Forest in Its Feathers': '12 x 16.5 in',
  'Keeper of the Green Horse': '12 x 16 in',
  'Village of Many Lives': '12 x 16 in',
  'Bull Above the Turning Earth': '12 x 16 in',
  'Close to the Forest': '12 x 16 in',
  'Memory Beside the Horse': '12 x 16 in',
  'A Small Pasture of Silence': '12 x 16 in',
  'Bird at the Open Hand': '12 x 16 in',
  'Rest Beneath White Leaves': '12 x 16 in',
  'The World in Her Arms': '12 x 16 in',
  'A Horse Made of Twilight': '12 x 16 in',
  "Garden in a Peacock's Wake": '12 x 16 in',
  'White Herd, Deep Night': '14 x 19 in',
  'Held Against the Heart': '14 x 19 in',
  'She Who Listens to Birds': '14 x 19 in',
  'Under One Quiet Wing': '12 x 16 in',
  'Where Bodies Become Branches': '14 x 19 in',
  'The Horse Between Us': '14 x 19 in',
  'Council Beneath the Trees': '14 x 19 in',
  'A Gathering of Wings and Faces': '14 x 19 in',
  'Under the Indigo Tree': '14 x 19 in',
  'Procession Under the Red Sun': '14 x 19 in',
  'The Faces She Carries': '14 x 19 in',
  "Rest at the Forest's Edge": '14 x 19 in',
  'Between Burden and Flight': '14 x 19 in',
  'Where the Herd Gathers': '14 x 19 in',
});

function getMigrationStore(strapi) {
  return strapi.store({
    type: 'core',
    name: 'sunilsawane',
    key: DIMENSION_MIGRATION_KEY,
  });
}

function validateSeriesRecords(artworks) {
  const expectedTitles = Object.keys(SERIES_DIMENSIONS);
  const actualTitles = new Set(artworks.map((artwork) => artwork.title));

  if (actualTitles.size !== expectedTitles.length) {
    throw new Error(
      `All That Breathes dimensions migration expected ${expectedTitles.length} matching artworks but found ${actualTitles.size}`
    );
  }

  const missingTitles = expectedTitles.filter((title) => !actualTitles.has(title));
  const unexpectedTitles = [...actualTitles].filter(
    (title) => !Object.hasOwn(SERIES_DIMENSIONS, title)
  );
  if (missingTitles.length > 0 || unexpectedTitles.length > 0) {
    throw new Error(
      `All That Breathes dimensions migration title mismatch: missing=${missingTitles.join(', ') || 'none'}; unexpected=${unexpectedTitles.join(', ') || 'none'}`
    );
  }
}

async function migrateArtworkDimensions(strapi) {
  const store = getMigrationStore(strapi);
  const existingState = await store.get();
  if (existingState?.status === 'completed') {
    return { ...existingState, skipped: true };
  }

  const artworkQuery = strapi.db.query(ARTWORK_UID);
  const artworks = await artworkQuery.findMany({
    where: { seriesName: SERIES_NAME },
    select: ['id', 'documentId', 'title', 'seriesName', 'dimensions'],
  });

  if (artworks.length === 0) {
    return { status: 'pending', updatedCount: 0, seriesName: SERIES_NAME };
  }

  validateSeriesRecords(artworks);

  const pendingState = existingState?.status === 'pending'
    ? existingState
    : {
        status: 'pending',
        seriesName: SERIES_NAME,
        startedAt: new Date().toISOString(),
        previousDimensions: artworks.map(({ id, documentId, title, dimensions }) => ({
          id,
          documentId,
          title,
          dimensions,
        })),
      };
  if (existingState?.status !== 'pending') {
    await store.set({ value: pendingState });
  }

  let updatedCount = 0;
  for (const artwork of artworks) {
    const expectedDimensions = SERIES_DIMENSIONS[artwork.title];
    if (artwork.dimensions === expectedDimensions) continue;

    await artworkQuery.update({
      where: { id: artwork.id },
      data: { dimensions: expectedDimensions },
    });
    updatedCount += 1;
  }

  const updatedArtworks = await artworkQuery.findMany({
    where: { seriesName: SERIES_NAME },
    select: ['id', 'title', 'dimensions'],
  });
  validateSeriesRecords(updatedArtworks);
  const mismatches = updatedArtworks.filter(
    (artwork) => artwork.dimensions !== SERIES_DIMENSIONS[artwork.title]
  );
  if (mismatches.length > 0) {
    throw new Error(
      `All That Breathes dimensions migration left ${mismatches.length} records unchanged`
    );
  }

  const completedState = {
    ...pendingState,
    status: 'completed',
    completedAt: new Date().toISOString(),
    updatedCount,
  };
  await store.set({ value: completedState });
  strapi.log.info(
    `[content-migration] Applied dimensions to ${updatedArtworks.length} ${SERIES_NAME} artworks`
  );
  return completedState;
}

module.exports = {
  ARTWORK_UID,
  DIMENSION_MIGRATION_KEY,
  SERIES_DIMENSIONS,
  SERIES_NAME,
  migrateArtworkDimensions,
};
