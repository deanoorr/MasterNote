
export const getCoordinates = async (location) => {
    try {
        const cleanLocation = location.replace(/[?.,!]/g, '').trim();
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanLocation)}&count=10&language=en&format=json`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            // Priority 1: Exact name match that is a country
            const countryMatch = data.results.find(r =>
                r.name.toLowerCase() === location.toLowerCase() &&
                (r.feature_code === 'PCLI' || r.feature_code === 'ADM1')
            );

            // Priority 2: First result that is a country or large region
            const regionMatch = data.results.find(r =>
                r.feature_code === 'PCLI' || r.feature_code === 'ADM1' || r.feature_code === 'PPLC'
            );

            const bestMatch = countryMatch || regionMatch || data.results[0];

            return {
                lat: bestMatch.latitude,
                lon: bestMatch.longitude,
                name: bestMatch.name,
                country: bestMatch.country,
                admin1: bestMatch.admin1
            };
        }
        return null;
    } catch (error) {
        console.error("Geocoding failed:", error);
        return null;
    }
};

export const getWeather = async (lat, lon) => {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Weather fetch failed:", error);
        return null;
    }
};
