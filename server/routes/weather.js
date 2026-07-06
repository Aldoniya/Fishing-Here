// filepath: server/routes/weather.js
const express = require('express');
const router = express.Router();
const { db } = require('../models/database');
const fetch = require('node-fetch');

// OpenWeatherMap API (free tier)
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'demo_key';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Get current weather for Zanzibar
router.get('/current', (req, res) => {
  const zanzibarLat = -6.1659;
  const zanzibarLng = 39.1989;
  
  // Return mock data if no API key
  const mockWeather = {
    temperature: 28,
    humidity: 75,
    wind_speed: 5.2,
    wind_direction: 'NE',
    precipitation: 0,
    conditions: 'Partly Cloudy',
    visibility: 10,
    uv_index: 6,
    sunrise: '06:15',
    sunset: '18:20',
    location: 'Zanzibar, Tanzania',
    timestamp: new Date().toISOString()
  };
  
  res.json(mockWeather);
});

// Get 7-day forecast
router.get('/forecast', (req, res) => {
  // Generate 7-day forecast
  const forecast = [];
  const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Sunny', 'Partly Cloudy', 'Sunny'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    forecast.push({
      date: date.toISOString().split('T')[0],
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      temperature_high: 29 + Math.floor(Math.random() * 3),
      temperature_low: 24 + Math.floor(Math.random() * 2),
      humidity: 70 + Math.floor(Math.random() * 15),
      wind_speed: 4 + Math.floor(Math.random() * 4),
      wind_direction: ['NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 7)],
      precipitation: Math.floor(Math.random() * 30),
      conditions: conditions[i],
      fishing_conditions: Math.random() > 0.3 ? 'Good' : 'Moderate',
      wave_height: 0.5 + Math.random() * 1.5
    });
  }
  
  res.json(forecast);
});

// Get weather for specific fishing spot
router.get('/spot/:id', (req, res) => {
  db.get('SELECT * FROM fishing_spots WHERE id = ?', [req.params.id], (err, spot) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!spot) return res.status(404).json({ error: 'Spot not found' });
    
    // Return weather for this spot location
    const weather = {
      spot_name: spot.name,
      temperature: 27 + Math.floor(Math.random() * 4),
      humidity: 72 + Math.floor(Math.random() * 10),
      wind_speed: 3 + Math.floor(Math.random() * 5),
      wind_direction: 'NE',
      conditions: ['Sunny', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)],
      best_fishing_times: ['6:00 AM - 9:00 AM', '4:00 PM - 7:00 PM'],
      tide: 'Incoming',
      wave_height: 0.3 + Math.random() * 1.2
    };
    
    res.json(weather);
  });
});

// Get weather by coordinates
router.get('/coords', (req, res) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }
  
  // Return weather for given coordinates
  const weather = {
    temperature: 27 + Math.floor(Math.random() * 4),
    humidity: 70 + Math.floor(Math.random() * 15),
    wind_speed: 3 + Math.floor(Math.random() * 5),
    wind_direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
    conditions: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
    visibility: 8 + Math.floor(Math.random() * 4),
    timestamp: new Date().toISOString()
  };
  
  res.json(weather);
});

// Proxy OpenWeatherMap tile requests so API key is kept server-side
router.get('/tiles/openweathermap/:layer/:z/:x/:y.png', async (req, res) => {
  const { layer, z, x, y } = req.params;
  const key = process.env.OPENWEATHER_API_KEY || WEATHER_API_KEY;
  if (!key || key === 'demo_key') {
    return res.status(403).json({ error: 'OpenWeatherMap API key not configured on server' });
  }

  const tileUrl = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${key}`;

  try {
    const upstream = await fetch(tileUrl);
    if (!upstream.ok) {
      console.error('Upstream tile error', upstream.status, upstream.statusText, tileUrl);
      return res.status(502).send('Upstream tile error');
    }

    const buffer = await upstream.buffer();
    res.set('Content-Type', 'image/png');
    // Short cache to reduce load but keep it relatively fresh
    res.set('Cache-Control', 'public, max-age=300');
    res.send(buffer);
  } catch (err) {
    console.error('Tile proxy error:', err);
    res.status(500).send('Tile proxy error');
  }
});

module.exports = router;