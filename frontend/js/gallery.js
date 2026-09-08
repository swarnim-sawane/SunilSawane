let allArtworks = [];
let currentCategory = 'all';
const galleryDom = window.domUtils || {};
const galleryApiBaseUrl = window.ART_CONFIG?.apiBaseUrl || 'https://growing-approval-51840080fc.strapiapp.com/api';
const galleryAssetBaseUrl = galleryApiBaseUrl.replace(/\/api\/?$/, '');

$(document).ready(function () {
  initGallery();
});

async function initGallery() {
  try {
    showLoading();

    const [artworks, categories] = await Promise.all([
      artAPI.fetchArtworks(),
      artAPI.fetchCategories()
    ]);

    allArtworks = artworks;
    loadCategoryFilters(categories);
    displayArtworks(allArtworks);
    hideLoading();
  } catch (error) {
    console.error('Error initializing gallery:', error);
    hideLoading();
    showError();
  }
}

function loadCategoryFilters(categories) {
  const container = $('#category-buttons');
  const allButton = $('#btn-all');
  container.empty();

  allButton
    .addClass('gallery-filter-button')
    .attr({ type: 'button', 'aria-pressed': 'true' })
    .empty()
    .append(
      document.createTextNode('All Artworks'),
      $('<span>').addClass('gallery-filter-count').text(allArtworks.length)
    );

  categories.forEach(category => {
    const categoryName = category.Name || category.name || category.attributes?.Name || category.attributes?.name || 'Unknown';
    const categorySlug = getCategorySlug(category);
    const count = getCategoryArtworkCount(categorySlug);

    const button = $('<button>')
      .addClass('btn gallery-filter-button')
      .attr({
        id: `btn-${categorySlug}`,
        type: 'button',
        'aria-pressed': 'false'
      })
      .append(
        document.createTextNode(categoryName),
        $('<span>').addClass('gallery-filter-count').text(count)
      )
      .on('click', function () {
        filterByCategory(categorySlug);
      });

    container.append(button);
  });

  updateGalleryResultCount(allArtworks.length, allArtworks.length);
}

function filterByCategory(categorySlug) {
  currentCategory = categorySlug;

  $('.category-buttons .gallery-filter-button')
    .removeClass('active')
    .attr('aria-pressed', 'false');

  const activeButton = document.getElementById(`btn-${categorySlug}`);
  if (activeButton) {
    activeButton.classList.add('active');
    activeButton.setAttribute('aria-pressed', 'true');
  }

  const filtered = categorySlug === 'all'
    ? allArtworks
    : allArtworks.filter(artwork => getArtworkCategorySlug(artwork) === categorySlug);

  displayArtworks(filtered);
}

function displayArtworks(artworks) {
  const grid = $('#gallery-grid');
  grid.empty();

  const visibleCount = artworks?.length || 0;
  updateGalleryResultCount(visibleCount, allArtworks.length);

  if (!artworks || artworks.length === 0) {
    $('#no-results').show();
    return;
  }

  $('#no-results').hide();

  artworks.forEach((artwork, index) => {
    const card = createArtworkCard(artwork, index);
    grid.append(card);
  });

  initGalleryCardInteractions();
}

function createArtworkCard(artwork, index = 0) {
  const title = artwork.title || artwork.Title || 'Untitled';
  const description = extractDescription(artwork.Description || artwork.description || '');
  const categoryName = getArtworkCategoryName(artwork);
  const year = artwork.yearCreated || artwork.YearCreated || artwork.year || artwork.Year || '';
  const note = description || 'A selected work from Sunil Sawane\'s collection.';
  const detailUrl = getArtworkDetailUrl(artwork);
  const imageSources = getArtworkImageSources(artwork);
  const imageUrl = safeGalleryUrl(imageSources.src, galleryDom.PLACEHOLDER_IMAGE);
  const accent = getArtworkAccent(artwork);
  const imageLoading = index < 2 ? 'eager' : 'lazy';
  const imagePriority = index < 2 ? 'high' : 'auto';
  const collected = isArtworkCollected(artwork);

  const $card = $('<div>').addClass('col-12 col-xl-6 gallery-artwork-item');
  const $article = $('<article>')
    .addClass(collected ? 'gallery-artwork-card gallery-artwork-record is-collected' : 'gallery-artwork-card gallery-artwork-record')
    .attr({
      'data-accent': accent
    })
    .css('--card-accent', accent);

  const $surface = $('<div>').addClass('gallery-card-surface');
  const $media = $('<div>').addClass('gallery-record-media');
  const $image = $('<img>')
    .attr({
      src: imageUrl,
      srcset: imageSources.srcset || undefined,
      sizes: '(max-width: 767px) 92vw, (max-width: 1199px) 44vw, 24vw',
      alt: title,
      loading: imageLoading,
      decoding: 'async',
      fetchpriority: imagePriority
    })
    .addClass('gallery-art-image')
    .data('artwork-id', artwork.id);

  const $imageLink = $('<a>')
    .addClass('gallery-art-frame')
    .attr({ href: detailUrl, 'aria-label': `View ${title}` })
    .append($image);

  const $meta = $('<div>').addClass('gallery-card-kicker gallery-record-meta').append(
    $('<span>').text(categoryName),
    $('<span>').text(year ? year : 'Selected work')
  );

  if (collected) {
    $meta.append(createGalleryStatusPill('Collected'));
  }

  const $caption = $('<div>').addClass('gallery-card-caption gallery-record-body').append(
    $meta,
    $('<h3>').addClass('gallery-card-title').append(
      $('<a>').attr('href', detailUrl).text(title)
    ),
    createGalleryCardNote(note),
    $('<a>')
      .addClass('gallery-view-link')
      .attr('href', detailUrl)
      .text('View artwork')
  );

  $media.append($imageLink);
  $surface.append($media, $caption);
  $article.append($surface);
  $card.append($article);

  $image.one('error', function () {
    $(this)
      .removeAttr('srcset')
      .attr('src', galleryDom.PLACEHOLDER_IMAGE || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="420"%3E%3Crect fill="%23f5f2ec" width="600" height="420"/%3E%3Ctext fill="%239b9488" x="50%25" y="50%25" text-anchor="middle" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E');
  });

  return $card;
}

function createGalleryCardNote(description) {
  return $('<p>')
    .addClass('gallery-card-note')
    .text(description || 'A selected work from Sunil Sawane\'s collection.');
}

function createGalleryStatusPill(label) {
  return $('<span>').addClass('gallery-status-pill').text(label);
}

function isArtworkAvailable(artwork) {
  return artwork?.isAvailable !== false &&
    artwork?.IsAvailable !== false &&
    artwork?.inStock !== false &&
    artwork?.InStock !== false;
}

function isArtworkCollected(artwork) {
  return !isArtworkAvailable(artwork);
}

function extractDescription(description) {
  if (typeof description === 'string') {
    return description.trim();
  }

  if (Array.isArray(description)) {
    return description
      .map(block => {
        if (typeof block === 'string') return block;
        if (Array.isArray(block.children)) {
          return block.children.map(child => child.text || '').join(' ');
        }
        return '';
      })
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return '';
}

function getCategorySlug(category) {
  return category.slug ||
    category.Slug ||
    category.attributes?.slug ||
    category.attributes?.Slug ||
    '';
}

function getArtworkCategorySlug(artwork) {
  return artwork.category?.data?.attributes?.slug ||
    artwork.category?.slug ||
    artwork.Category?.slug ||
    artwork.Category?.data?.attributes?.slug ||
    '';
}

function getArtworkCategoryName(artwork) {
  return artwork.category?.data?.attributes?.Name ||
    artwork.category?.data?.attributes?.name ||
    artwork.category?.Name ||
    artwork.category?.name ||
    artwork.Category?.Name ||
    artwork.Category?.name ||
    'Artwork';
}

function getCategoryArtworkCount(categorySlug) {
  return allArtworks.filter(artwork => getArtworkCategorySlug(artwork) === categorySlug).length;
}

function formatGalleryResultCount(count, total) {
  if (total === 0) return 'No works';
  if (currentCategory === 'all') return `${total} works`;
  return `${count} of ${total}`;
}

function updateGalleryResultCount(count, total) {
  $('#gallery-result-count').text(formatGalleryResultCount(count, total));
}

function getArtworkDetailUrl(artwork) {
  const detailId = artwork.documentId || artwork.id || artwork.slug || artwork.Slug || '';
  return `artwork-detail.html?id=${encodeURIComponent(String(detailId))}`;
}

function getArtworkAccent(artwork) {
  const accents = ['#787d62', '#8f6d39', '#4f6f64', '#7f4b3a', '#3f5368'];
  const seed = Number(artwork.id || 0) || String(artwork.documentId || artwork.title || '').length;
  return accents[Math.abs(seed) % accents.length];
}

function initGalleryCardInteractions() {
  const cards = document.querySelectorAll('.gallery-artwork-card');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          instance.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.16 });

    cards.forEach(card => observer.observe(card));
  } else {
    cards.forEach(card => card.classList.add('is-revealed'));
  }

  cards.forEach(card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
    });

    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--pointer-x');
      card.style.removeProperty('--pointer-y');
    });
  });
}

function safeGalleryUrl(url, fallback) {
  if (typeof galleryDom.safeUrl === 'function') {
    return galleryDom.safeUrl(url, fallback);
  }

  return url || fallback || '';
}

function getArtworkImageAsset(artwork) {
  return artwork.images?.data?.[0]?.attributes ||
    artwork.images?.data?.[0] ||
    (Array.isArray(artwork.images) ? artwork.images[0] : null) ||
    artwork.Image?.data?.attributes ||
    artwork.Image?.data ||
    artwork.Image ||
    null;
}

function resolveArtworkImageUrl(url) {
  if (!url) return '';
  return url.startsWith('http') ? url : galleryAssetBaseUrl + url;
}

function getArtworkImageSources(artwork) {
  const image = getArtworkImageAsset(artwork);
  const formats = image?.formats || {};
  const variants = [formats?.small, formats?.medium, formats?.large]
    .filter(format => format?.url && format?.width)
    .map(format => resolveArtworkImageUrl(format.url) + ' ' + format.width + 'w');
  const preferredUrl = formats?.large?.url || formats?.medium?.url || formats?.small?.url || image?.url;

  return {
    src: resolveArtworkImageUrl(preferredUrl) || galleryDom.PLACEHOLDER_IMAGE || '',
    srcset: variants.join(', ')
  };
}

function getImageUrl(artwork) {
  if (artwork.images?.data?.[0]?.attributes?.url) {
    const url = artwork.images.data[0].attributes.url;
    return url.startsWith('http') ? url : `${galleryAssetBaseUrl}${url}`;
  }

  if (artwork.images?.data?.[0]?.url) {
    const url = artwork.images.data[0].url;
    return url.startsWith('http') ? url : `${galleryAssetBaseUrl}${url}`;
  }

  if (Array.isArray(artwork.images) && artwork.images[0]?.url) {
    const url = artwork.images[0].url;
    return url.startsWith('http') ? url : `${galleryAssetBaseUrl}${url}`;
  }

  if (artwork.Image?.url) {
    const url = artwork.Image.url;
    return url.startsWith('http') ? url : `${galleryAssetBaseUrl}${url}`;
  }

  return galleryDom.PLACEHOLDER_IMAGE || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="420"%3E%3Crect fill="%23f5f2ec" width="600" height="420"/%3E%3Ctext fill="%239b9488" x="50%25" y="50%25" text-anchor="middle" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E';
}

function viewArtwork(id) {
  window.location.href = `artwork-detail.html?id=${encodeURIComponent(String(id))}`;
}

function showLoading() {
  $('#loading-indicator').show();
  $('#gallery-grid').hide();
}

function hideLoading() {
  $('#loading-indicator').hide();
  $('#gallery-grid').show();
}

function showError() {
  $('#loading-indicator').hide();
  $('#gallery-grid').empty().append(
    $('<div>').addClass('col-12 text-center py-5').append(
      $('<h3>').text('Error Loading Gallery'),
      $('<p>').text('Unable to load artworks. Please try again later.'),
      $('<button>')
        .addClass('btn btn-primary')
        .text('Retry')
        .on('click', function () {
          location.reload();
        })
    )
  ).show();
}
