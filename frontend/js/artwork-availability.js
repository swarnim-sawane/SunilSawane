(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.artworkAvailability = api;
}(typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';

    const statuses = ['available', 'reserved', 'sold', 'not_for_sale'];
    const ranks = { available: 0, reserved: 1, sold: 2, not_for_sale: 3 };
    const labels = {
        available: 'Available',
        reserved: 'Reserved',
        sold: 'Sold',
        not_for_sale: 'Not for sale'
    };
    const enquiryLabels = {
        available: 'Enquire / Reserve',
        reserved: 'Enquire About Availability',
        sold: 'Request a Similar Work',
        not_for_sale: 'Enquire About This Work'
    };

    function legacyAvailable(artwork) {
        return artwork?.isAvailable !== false &&
            artwork?.IsAvailable !== false &&
            artwork?.inStock !== false &&
            artwork?.InStock !== false;
    }

    function getStatus(artwork) {
        const rawStatus = String(
            artwork?.availabilityStatus || artwork?.AvailabilityStatus || ''
        ).trim().toLowerCase();
        const isLegacyAvailable = legacyAvailable(artwork);

        if (rawStatus === 'available' && !isLegacyAvailable) return 'sold';
        if (statuses.includes(rawStatus)) return rawStatus;
        return isLegacyAvailable ? 'available' : 'sold';
    }

    function isPurchasable(artwork) {
        return getStatus(artwork) === 'available' && legacyAvailable(artwork);
    }

    function resolveStatus(statusOrArtwork) {
        return typeof statusOrArtwork === 'string'
            ? statusOrArtwork
            : getStatus(statusOrArtwork);
    }

    function getStatusLabel(statusOrArtwork) {
        return labels[resolveStatus(statusOrArtwork)] || labels.available;
    }

    function getPurchaseLabel(statusOrArtwork) {
        const status = resolveStatus(statusOrArtwork);
        return status === 'available' ? 'Add to Cart' : getStatusLabel(status);
    }

    function getEnquiryLabel(statusOrArtwork) {
        return enquiryLabels[resolveStatus(statusOrArtwork)] || enquiryLabels.available;
    }

    function getEnquiryPrompt(artwork) {
        const title = artwork?.title || artwork?.Title || 'this artwork';
        const status = getStatus(artwork);

        if (status === 'sold') {
            return `I am interested in a similar commissioned work inspired by ${title}. Please share what may be possible.`;
        }
        if (status === 'reserved') {
            return `I am interested in ${title}. Please let me know if it becomes available or if a similar work can be commissioned.`;
        }
        if (status === 'not_for_sale') {
            return `I would like to enquire about ${title} and whether a related work or commission may be possible.`;
        }
        return `I am interested in ${title}. Please share availability and delivery details.`;
    }

    function getUnavailableMessage(statusOrArtwork) {
        const status = resolveStatus(statusOrArtwork);
        if (status === 'reserved') return 'This artwork is currently reserved.';
        if (status === 'not_for_sale') return 'This artwork is not offered for sale.';
        return 'This artwork has been sold.';
    }

    function getStatusClass(statusOrArtwork) {
        return `is-${resolveStatus(statusOrArtwork).replaceAll('_', '-')}`;
    }

    function compareAvailability(left, right) {
        return ranks[getStatus(left)] - ranks[getStatus(right)];
    }

    function shouldShowInShop(artwork) {
        const price = Number(artwork?.price || artwork?.Price || 0);
        return price > 0 || getStatus(artwork) !== 'available';
    }

    return {
        compareAvailability,
        getEnquiryLabel,
        getEnquiryPrompt,
        getPurchaseLabel,
        getStatus,
        getStatusClass,
        getStatusLabel,
        getUnavailableMessage,
        isPurchasable,
        shouldShowInShop
    };
}));
