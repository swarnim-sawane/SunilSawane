(function (root, factory) {
  const discovery = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = discovery;
  }

  if (root) {
    root.artworkDiscovery = discovery;
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  function extractDescription(description) {
    if (typeof description === 'string') return description.trim();
    if (!Array.isArray(description)) return '';

    return description
      .map((block) => {
        if (typeof block === 'string') return block;
        if (!Array.isArray(block?.children)) return '';
        return block.children.map((child) => child?.text || '').join(' ');
      })
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getCategorySlug(category) {
    return category?.slug || category?.Slug || category?.attributes?.slug || category?.attributes?.Slug || '';
  }

  function getArtworkCategory(artwork) {
    return artwork?.category?.data?.attributes || artwork?.category?.data || artwork?.category ||
      artwork?.Category?.data?.attributes || artwork?.Category?.data || artwork?.Category || {};
  }

  function getArtworkCategorySlug(artwork) {
    return getCategorySlug(getArtworkCategory(artwork));
  }

  function getArtworkCategoryName(artwork) {
    const category = getArtworkCategory(artwork);
    return category?.Name || category?.name || '';
  }

  function isFeaturedArtwork(artwork) {
    return artwork?.isFeatured === true || artwork?.isFeatured === 'true';
  }

  function getPopulatedCategories(categories, artworks) {
    const populatedSlugs = new Set((artworks || []).map(getArtworkCategorySlug).filter(Boolean));
    return (categories || []).filter((category) => populatedSlugs.has(getCategorySlug(category)));
  }

  function normalizeSearchValue(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getArtworkSearchText(artwork) {
    return normalizeSearchValue([
      artwork?.title || artwork?.Title,
      extractDescription(artwork?.Description || artwork?.description),
      artwork?.medium || artwork?.Medium,
      artwork?.yearCreated || artwork?.YearCreated || artwork?.year || artwork?.Year,
      getArtworkCategoryName(artwork),
    ].filter(Boolean).join(' '));
  }

  function filterArtworks(artworks, options = {}) {
    const categorySlug = options.categorySlug || 'all';
    const query = normalizeSearchValue(options.query);

    return (artworks || []).filter((artwork) => {
      const categoryMatches = categorySlug === 'all' || getArtworkCategorySlug(artwork) === categorySlug;
      const queryMatches = !query || getArtworkSearchText(artwork).includes(query);
      return categoryMatches && queryMatches;
    });
  }

  return {
    extractDescription,
    filterArtworks,
    getArtworkCategoryName,
    getArtworkCategorySlug,
    getCategorySlug,
    getPopulatedCategories,
    isFeaturedArtwork,
    normalizeSearchValue,
  };
}));
