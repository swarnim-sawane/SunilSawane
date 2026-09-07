#!/usr/bin/env node
'use strict';

const DEFAULT_STRAPI_URL = 'http://localhost:1337';
const REQUIRED_TEXT_FIELDS = [
  'dimensions',
  'medium',
  'shippingNote',
  'certificateNote',
];

function getStrapiUrl() {
  return String(process.env.STRAPI_URL || process.env.PUBLIC_URL || DEFAULT_STRAPI_URL).replace(/\/+$/, '');
}

function normalizeRecord(record) {
  return {
    id: record.id,
    documentId: record.documentId || record.attributes?.documentId,
    ...(record.attributes || record),
  };
}

function hasText(value) {
  return String(value || '').trim().length > 0;
}

function hasPositivePrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0;
}

function getMissingFields(artwork) {
  const missing = [];

  for (const field of REQUIRED_TEXT_FIELDS) {
    if (!hasText(artwork[field])) {
      missing.push(field);
    }
  }

  if (!hasPositivePrice(artwork.price)) {
    missing.push('price');
  }

  if (!Number.isInteger(Number(artwork.yearCreated)) || Number(artwork.yearCreated) < 1900) {
    missing.push('yearCreated');
  }

  if (typeof artwork.isAvailable !== 'boolean') {
    missing.push('isAvailable');
  }

  if (!hasText(artwork.framingStatus) || artwork.framingStatus === 'to_be_confirmed') {
    missing.push('framingStatus');
  }

  return missing;
}

async function fetchArtworkPage(page) {
  const url = new URL('/api/artworks', getStrapiUrl());
  url.searchParams.set('pagination[page]', String(page));
  url.searchParams.set('pagination[pageSize]', '100');
  url.searchParams.set('populate', '*');
  url.searchParams.set('sort', 'title:asc');

  const headers = {};
  if (process.env.STRAPI_API_TOKEN) {
    headers.Authorization = `Bearer ${process.env.STRAPI_API_TOKEN}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Unable to fetch artworks from ${url}: HTTP ${response.status}`);
  }

  return response.json();
}

async function fetchAllArtworks() {
  const artworks = [];
  let page = 1;
  let pageCount = 1;

  do {
    const payload = await fetchArtworkPage(page);
    artworks.push(...(payload.data || []).map(normalizeRecord));
    pageCount = Number(payload.meta?.pagination?.pageCount || 1);
    page += 1;
  } while (page <= pageCount);

  return artworks;
}

async function main() {
  const artworks = await fetchAllArtworks();
  const incomplete = artworks
    .map((artwork) => ({
      title: artwork.title || artwork.Name || `Artwork ${artwork.id}`,
      missing: getMissingFields(artwork),
    }))
    .filter((entry) => entry.missing.length > 0);

  if (artworks.length === 0) {
    console.error('No artworks returned by Strapi. Check STRAPI_URL and public/API token permissions.');
    process.exit(1);
  }

  if (incomplete.length > 0) {
    console.error(`Artwork collector data incomplete: ${incomplete.length}/${artworks.length} artworks need updates.`);
    for (const entry of incomplete) {
      console.error(`- ${entry.title}: ${entry.missing.join(', ')}`);
    }
    process.exit(1);
  }

  console.log(`Artwork collector data complete for ${artworks.length} artworks.`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = {
  getMissingFields,
  normalizeRecord,
};
