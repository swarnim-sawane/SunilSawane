'use strict';

const ARTWORK_UID = 'api::artwork.artwork';
const MIGRATION_KEY = 'artwork-price-7999-v1';
const TARGET_PRICE = 7999;
const TIER_MIGRATION_KEY = 'artwork-featured-price-9999-v2';
const STANDARD_PRICE = TARGET_PRICE;
const FEATURED_PRICE = 9999;

function getMigrationStore(strapi) {
  return strapi.store({
    type: 'core',
    name: 'sunilsawane',
    key: MIGRATION_KEY,
  });
}

async function migrateArtworkPrices(strapi) {
  const store = getMigrationStore(strapi);
  const existingState = await store.get();

  if (existingState?.status === 'completed') {
    return { ...existingState, skipped: true };
  }

  const artworkQuery = strapi.db.query(ARTWORK_UID);
  const artworks = await artworkQuery.findMany({
    select: ['id', 'documentId', 'price'],
  });

  if (artworks.length === 0) {
    return { status: 'pending', updatedCount: 0, targetPrice: TARGET_PRICE };
  }

  const pendingState = existingState?.status === 'pending'
    ? existingState
    : {
        status: 'pending',
        targetPrice: TARGET_PRICE,
        startedAt: new Date().toISOString(),
        previousPrices: artworks.map((artwork) => ({
          id: artwork.id,
          documentId: artwork.documentId,
          price: artwork.price,
        })),
      };

  if (existingState?.status !== 'pending') {
    await store.set({ value: pendingState });
  }

  const updateResult = await artworkQuery.updateMany({
    where: {},
    data: { price: TARGET_PRICE },
  });
  const updatedArtworks = await artworkQuery.findMany({
    select: ['id', 'price'],
  });
  const mismatches = updatedArtworks.filter(
    (artwork) => Number(artwork.price) !== TARGET_PRICE
  );

  if (mismatches.length > 0) {
    throw new Error(`Artwork price migration left ${mismatches.length} records unchanged`);
  }

  const completedState = {
    ...pendingState,
    status: 'completed',
    completedAt: new Date().toISOString(),
    updatedCount: updateResult?.count ?? updatedArtworks.length,
  };
  await store.set({ value: completedState });
  strapi.log.info(
    `[content-migration] Set ${updatedArtworks.length} artwork records to INR ${TARGET_PRICE}`
  );

  return completedState;
}

async function migrateArtworkTierPrices(strapi) {
  const store = strapi.store({
    type: 'core',
    name: 'sunilsawane',
    key: TIER_MIGRATION_KEY,
  });
  const existingState = await store.get();

  if (existingState?.status === 'completed') {
    return { ...existingState, skipped: true };
  }

  const artworkQuery = strapi.db.query(ARTWORK_UID);
  const artworks = await artworkQuery.findMany({
    select: ['id', 'documentId', 'price', 'isFeatured'],
  });

  if (artworks.length === 0) {
    return { status: 'pending', updatedCount: 0, standardPrice: STANDARD_PRICE, featuredPrice: FEATURED_PRICE };
  }

  const pendingState = existingState?.status === 'pending'
    ? existingState
    : {
        status: 'pending',
        standardPrice: STANDARD_PRICE,
        featuredPrice: FEATURED_PRICE,
        startedAt: new Date().toISOString(),
        previousPrices: artworks.map(({ id, documentId, price, isFeatured }) => ({
          id,
          documentId,
          price,
          isFeatured,
        })),
      };

  if (existingState?.status !== 'pending') {
    await store.set({ value: pendingState });
  }

  for (const artwork of artworks) {
    await artworkQuery.update({
      where: { id: artwork.id },
      data: { price: artwork.isFeatured === true ? FEATURED_PRICE : STANDARD_PRICE },
    });
  }

  const updatedArtworks = await artworkQuery.findMany({
    select: ['id', 'price', 'isFeatured'],
  });
  const mismatches = updatedArtworks.filter((artwork) => {
    const expectedPrice = artwork.isFeatured === true ? FEATURED_PRICE : STANDARD_PRICE;
    return Number(artwork.price) !== expectedPrice;
  });

  if (mismatches.length > 0) {
    throw new Error(`Artwork tier migration left ${mismatches.length} records incorrectly priced`);
  }

  const completedState = {
    ...pendingState,
    status: 'completed',
    completedAt: new Date().toISOString(),
    updatedCount: updatedArtworks.length,
  };
  await store.set({ value: completedState });
  strapi.log.info(
    `[content-migration] Priced featured artworks at INR ${FEATURED_PRICE} and standard artworks at INR ${STANDARD_PRICE}`
  );

  return completedState;
}

module.exports = {
  ARTWORK_UID,
  MIGRATION_KEY,
  TARGET_PRICE,
  TIER_MIGRATION_KEY,
  STANDARD_PRICE,
  FEATURED_PRICE,
  migrateArtworkPrices,
  migrateArtworkTierPrices,
};
