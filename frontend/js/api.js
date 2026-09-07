// js/api.js
window.ART_CONFIG = Object.assign({
    apiBaseUrl: 'https://growing-approval-51840080fc.strapiapp.com/api'
}, window.ART_CONFIG || {});

class ArtAPI {
    constructor() {
        this.baseURL = window.ART_CONFIG.apiBaseUrl;
    }

    async fetchArtworks(filters = {}) {
        try {
            const pageSize = filters.pageSize || 100;
            const buildUrl = (page) => {
                const params = new URLSearchParams();
                params.set('populate', '*');
                params.set('pagination[pageSize]', pageSize);
                params.set('pagination[page]', page);

                if (filters.category) {
                    params.set('filters[category][slug][$eq]', filters.category);
                }

                if (filters.featured) {
                    params.set('filters[isFeatured][$eq]', 'true');
                }

                return `${this.baseURL}/artworks?${params.toString()}`;
            };

            const response = await fetch(buildUrl(1));
            const data = await response.json();
            const artworks = data.data || [];
            const pageCount = data.meta?.pagination?.pageCount || 1;

            for (let page = 2; page <= pageCount; page += 1) {
                const nextResponse = await fetch(buildUrl(page));
                const nextData = await nextResponse.json();
                artworks.push(...(nextData.data || []));
            }

            return artworks;
        } catch (error) {
            console.error('Error fetching artworks:', error);
            return [];
        }
    }

    async fetchArtworkBySlug(slug) {
        try {
            const response = await fetch(
                `${this.baseURL}/artworks?filters[slug][$eq]=${slug}&populate=*`
            );
            const data = await response.json();
            return data.data?.[0] || null;
        } catch (error) {
            console.error('Error fetching artwork:', error);
            return null;
        }
    }

    async fetchCategories() {
        try {
            const response = await fetch(`${this.baseURL}/categories`);
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    }

    async createOrder(orderData) {
        try {
            const response = await fetch(`${this.baseURL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: orderData })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    }
}

// Global instance
const artAPI = new ArtAPI();
window.artAPI = artAPI;
