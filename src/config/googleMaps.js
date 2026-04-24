const { Loader } = require('@googlemaps/js-api-loader');
require('dotenv').config();

let mapLoader = null;

const initMapLoader = () => {
    if (!mapLoader && process.env.GOOGLE_MAPS_API_KEY) {
        mapLoader = new Loader({
            apiKey: process.env.GOOGLE_MAPS_API_KEY,
            version: 'weekly',
            libraries: ['places']
        });
    }
    return mapLoader;
};

module.exports = { initMapLoader };