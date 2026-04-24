const express = require('express');
const router = express.Router();
const axios = require('axios');

// Middleware para verificar autenticación
const isAuthenticated = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    next();
};

// Geocodificar dirección a coordenadas
router.get('/geocode', async (req, res) => {
    try {
        const { address } = req.query;
        
        if (!address) {
            return res.status(400).json({ error: 'Dirección requerida' });
        }
        
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: address,
                key: process.env.GOOGLE_MAPS_API_KEY
            }
        });
        
        if (response.data.status === 'OK') {
            const location = response.data.results[0].geometry.location;
            res.json({
                success: true,
                lat: location.lat,
                lng: location.lng,
                formattedAddress: response.data.results[0].formatted_address
            });
        } else {
            res.json({ success: false, error: 'No se encontró la dirección' });
        }
        
    } catch (error) {
        console.error('Error en geocodificación:', error);
        res.status(500).json({ error: 'Error al procesar la dirección' });
    }
});

// Autocompletar direcciones
router.get('/autocomplete', async (req, res) => {
    try {
        const { input } = req.query;
        
        if (!input || input.length < 3) {
            return res.json({ predictions: [] });
        }
        
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
            params: {
                input: input,
                key: process.env.GOOGLE_MAPS_API_KEY,
                types: 'geocode|establishment'
            }
        });
        
        const predictions = response.data.predictions.map(p => ({
            description: p.description,
            placeId: p.place_id
        }));
        
        res.json({ predictions });
        
    } catch (error) {
        console.error('Error en autocompletado:', error);
        res.json({ predictions: [] });
    }
});

// Obtener detalles de un lugar
router.get('/place-details', async (req, res) => {
    try {
        const { placeId } = req.query;
        
        if (!placeId) {
            return res.status(400).json({ error: 'Place ID requerido' });
        }
        
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
            params: {
                place_id: placeId,
                key: process.env.GOOGLE_MAPS_API_KEY,
                fields: 'name,formatted_address,geometry,formatted_phone_number,website'
            }
        });
        
        if (response.data.status === 'OK') {
            const place = response.data.result;
            res.json({
                success: true,
                name: place.name,
                address: place.formatted_address,
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng,
                phone: place.formatted_phone_number,
                website: place.website
            });
        } else {
            res.json({ success: false, error: 'No se encontró el lugar' });
        }
        
    } catch (error) {
        console.error('Error en detalles del lugar:', error);
        res.status(500).json({ error: 'Error al obtener detalles' });
    }
});

module.exports = router;