// js/api.js
class ArtAPI {
    constructor() {
        // Update this when you deploy
        this.baseURL = 'https://growing-approval-51840080fc.strapiapp.com/api';
    }

    async fetchArtworks(filters = {}) {
        try {
            let url = `${this.baseURL}/artworks?populate=*`;
            
            // Add category filter if provided
            if (filters.category) {
                url += `&filters[category][slug][$eq]=${filters.category}`;
            }
            
            // Add featured filter if provided
            if (filters.featured) {
                url += `&filters[isFeatured][$eq]=true`;
            }
            
            const response = await fetch(url);
            const data = await response.json();
            return data.data || [];
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
