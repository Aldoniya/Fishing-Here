// filepath: server/routes/fishing.js
const express = require('express');
const router = express.Router();
const { db } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

// Get all fishing spots
router.get('/spots', (req, res) => {
  db.all('SELECT * FROM fishing_spots ORDER BY name', (err, spots) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(spots);
  });
});

// Get fishing spot by ID
router.get('/spots/:id', (req, res) => {
  db.get('SELECT * FROM fishing_spots WHERE id = ?', [req.params.id], (err, spot) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!spot) return res.status(404).json({ error: 'Spot not found' });
    res.json(spot);
  });
});

// Get nearby fishing spots
router.get('/spots/nearby', (req, res) => {
  const { lat, lng, radius = 50 } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }

  // Simple distance calculation (approximate)
  db.all('SELECT * FROM fishing_spots', (err, spots) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    
    const nearby = spots.filter(spot => {
      const distance = calculateDistance(parseFloat(lat), parseFloat(lng), spot.latitude, spot.longitude);
      return distance <= radius;
    });
    
    res.json(nearby);
  });
});

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Add new fishing spot (admin only)
router.post('/spots', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { name, description, latitude, longitude, fish_type, best_season, depth, accessibility, safety_level } = req.body;

  db.run(
    `INSERT INTO fishing_spots (name, description, latitude, longitude, fish_type, best_season, depth, accessibility, safety_level)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, description, latitude, longitude, fish_type, best_season, depth, accessibility, safety_level],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to add spot' });
      res.status(201).json({ message: 'Spot added successfully', id: this.lastID });
    }
  );
});

// Get routes
router.get('/routes', (req, res) => {
  db.all('SELECT * FROM routes ORDER BY name', (err, routes) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(routes);
  });
});

// Add route
router.post('/routes', authenticateToken, (req, res) => {
  const { name, start_lat, start_lng, end_lat, end_lng, waypoints, distance, estimated_time } = req.body;

  db.run(
    `INSERT INTO routes (name, start_lat, start_lng, end_lat, end_lng, waypoints, distance, estimated_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, start_lat, start_lng, end_lat, end_lng, JSON.stringify(waypoints), distance, estimated_time],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to add route' });
      res.status(201).json({ message: 'Route added successfully', id: this.lastID });
    }
  );
});

module.exports = router;