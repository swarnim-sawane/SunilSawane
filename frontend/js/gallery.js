// js/gallery.js - Fixed version
let allArtworks = [];
let currentCategory = 'all';

$(document).ready(function () {
  console.log('Gallery page loaded');
  initGallery();
});

async function initGallery() {
  try {
    showLoading();

    const [artworks, categories] = await Promise.all([
      artAPI.fetchArtworks(),
      artAPI.fetchCategories()
    ]);

    console.log('Fetched artworks:', artworks);
    console.log('Fetched categories:', categories);

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
  container.empty();

  categories.forEach(category => {
    const categoryName = category.Name || category.name || 'Unknown';
    const categorySlug = category.slug || '';

    const button = $('<button>')
      .addClass('btn')
      .attr('id', `btn-${categorySlug}`)
      .text(categoryName)
      .on('click', function () {
        filterByCategory(categorySlug);
      });

    container.append(button);
  });
}

function filterByCategory(categorySlug) {
  currentCategory = categorySlug;

  // Update active button
  $('.category-buttons .btn').removeClass('active');
  $(`#btn-${categorySlug}`).addClass('active');

  // Filter artworks
  let filtered;
  if (categorySlug === 'all') {
    filtered = allArtworks;
  } else {
    filtered = allArtworks.filter(artwork => {
      const artworkCategory = artwork.category?.data?.attributes?.slug ||
        artwork.category?.slug ||
        artwork.Category?.slug;
      return artworkCategory === categorySlug;
    });
  }

  displayArtworks(filtered);
}

function displayArtworks(artworks) {
  const grid = $('#gallery-grid');
  grid.empty();

  if (!artworks || artworks.length === 0) {
    $('#no-results').show();
    return;
  }

  $('#no-results').hide();

  artworks.forEach(artwork => {
    const card = createArtworkCard(artwork);
    grid.append(card);
  });
}

function createArtworkCard(artwork) {
  const title = artwork.title || artwork.Title || 'Untitled';
  const description = artwork.Description || artwork.description || '';
  const slug = artwork.slug || artwork.documentId;
  const isFeatured = artwork.isFeatured || artwork.IsFeatured || false;

  // Get description text (handle both string and array formats)
  let descText = '';
  if (typeof description === 'string') {
    descText = description;
  } else if (Array.isArray(description) && description[0]?.children?.[0]?.text) {
    descText = description[0].children[0].text;
  }

  const imageUrl = getImageUrl(artwork);

  const cardHtml = `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="product-card">
                <div class="card-detail d-flex justify-content-between align-items-baseline pt-3 px-3">
                    <h3 class="card-title text-uppercase fs-6">${title}</h3>
                </div>
                <div class="image-overlay position-relative">
                    ${isFeatured ? '<span class="badge bg-warning position-absolute top-0 start-0 m-2">Featured</span>' : ''}
                    <div class="product-image">
                        <img src="${imageUrl}" alt="${title}" 
                             class="img-fluid" 
                             style="width: 100%; height: 300px; object-fit: cover; background: #f0f0f0;"
                             data-artwork-id="${artwork.id}">
                        <div class="text-box box-slide position-absolute">
                            <div class="text-content p-4 bg-light">
                                <h4>${title}</h4>
                                ${descText ? `<p class="mt-3">${descText}</p>` : '<p class="mt-3">Click to view more details</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

  const $card = $(cardHtml);

  // Add error handler for images
  $card.find(`[data-artwork-id="${artwork.id}"]`).one('error', function () {
    $(this).attr('src', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E');
  });

  return $card;
}


function getImageUrl(artwork) {
  if (artwork.images?.data?.[0]?.attributes?.url) {
    const url = artwork.images.data[0].attributes.url;
    return url.startsWith('http') ? url : `https://growing-approval-51840080fc.strapiapp.com${url}`;
  }

  if (artwork.images?.data?.[0]?.url) {
    const url = artwork.images.data[0].url;
    return url.startsWith('http') ? url : `https://growing-approval-51840080fc.strapiapp.com${url}`;
  }

  if (Array.isArray(artwork.images) && artwork.images[0]?.url) {
    const url = artwork.images[0].url;
    return url.startsWith('http') ? url : `https://growing-approval-51840080fc.strapiapp.com${url}`;
  }

  if (artwork.Image?.url) {
    const url = artwork.Image.url;
    return url.startsWith('http') ? url : `https://growing-approval-51840080fc.strapiapp.com${url}`;
  }

  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e0e0e0" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';
}

function viewArtwork(slug) {
  window.location.href = `artwork-detail.html?slug=${slug}`;
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
  const errorHtml = `
        <div class="col-12 text-center py-5">
            <h3>Error Loading Gallery</h3>
            <p>Unable to load artworks. Please try again later.</p>
            <button class="btn btn-primary" onclick="location.reload()">Retry</button>
        </div>
    `;
  $('#gallery-grid').html(errorHtml).show();
}
