
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = import.meta.env.VITE_GOOGLE_SEARCH_CX;
const BASE_URL = 'https://www.googleapis.com/customsearch/v1';

export const searchImages = async (query) => {
    if (!API_KEY || !SEARCH_ENGINE_ID) {
        console.warn("Missing Google Search API Key or CX ID");
        return null;
    }

    try {
        const url = new URL(BASE_URL);
        url.searchParams.append('key', API_KEY);
        url.searchParams.append('cx', SEARCH_ENGINE_ID);
        url.searchParams.append('q', query);
        url.searchParams.append('searchType', 'image');
        url.searchParams.append('num', '6'); // Fetch 6 images for the carousel
        url.searchParams.append('safe', 'active');
        url.searchParams.append('imgSize', 'huge'); // Request maximum quality
        url.searchParams.append('imgType', 'photo'); // Prefer photos over clipart/graphics

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`Google Search API Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.items) return [];

        return data.items.map(item => ({
            title: item.title,
            link: item.link, // Image URL
            thumbnailLink: item.image?.thumbnailLink || item.link,
            contextLink: item.image?.contextLink || item.link, // Page URL
            width: item.image?.width,
            height: item.image?.height,
            source: item.displayLink
        }));

    } catch (error) {
        console.error("Image Search Failed:", error);
        return [];
    }
};
