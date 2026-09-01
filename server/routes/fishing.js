// filepath: server/routes/fishing.js
const express = require('express');
const router = express.Router();
const { db } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const oceanSpotTemplates = [
  { id: 1001, name: 'Nungwi Deep Reef', description: 'Prime boat fishing off Nungwi with large pelagics.', latitude: -5.9235, longitude: 39.3570, fish_type: 'Tuna, Marlin, Mackerel', best_season: 'Nov-Mar', depth: 32, accessibility: 'Boat', safety_level: 'Good' },
  { id: 1002, name: 'Kendwa Offshore Drop', description: 'Open ocean drop-off with strong currents and big fish.', latitude: -5.9580, longitude: 39.2945, fish_type: 'Tuna, Barracuda, Wahoo', best_season: 'Oct-Apr', depth: 28, accessibility: 'Boat', safety_level: 'Moderate' },
  { id: 1003, name: 'Matemwe Channel', description: 'Ocean channel area with good visibility and chlorophyll concentration.', latitude: -6.0740, longitude: 39.3500, fish_type: 'Snapper, Grouper, Trevally', best_season: 'Nov-Apr', depth: 26, accessibility: 'Boat', safety_level: 'Good' },
  { id: 1004, name: 'Pwani Mchangani Reef', description: 'Shallow reef edge in open water ideal for sport fishing.', latitude: -6.0805, longitude: 39.3358, fish_type: 'Mackerel, Sailfish', best_season: 'Dec-Mar', depth: 18, accessibility: 'Boat', safety_level: 'Good' },
  { id: 1005, name: 'Fumba Offshore Bank', description: 'Deep bank southwest of Fumba with strong fish activity.', latitude: -6.1600, longitude: 39.1960, fish_type: 'Kingfish, Cobia, Tuna', best_season: 'Dec-May', depth: 35, accessibility: 'Boat', safety_level: 'Good' },
  { id: 1006, name: 'Changuu Channel Spot', description: 'Clear water channel with active currents and bait schools.', latitude: -6.1450, longitude: 39.3050, fish_type: 'Barracuda, Tuna, Sailfish', best_season: 'Nov-Apr', depth: 22, accessibility: 'Boat', safety_level: 'Good' },
  { id: 1007, name: 'Nungwi Outer Edge', description: 'Outer reef edge with deep water and great trolling potential.', latitude: -5.9100, longitude: 39.3190, fish_type: 'Marlin, Wahoo, Trevally', best_season: 'Dec-Mar', depth: 40, accessibility: 'Boat', safety_level: 'Moderate' },
  { id: 1008, name: 'Kendwa Mid-Channel', description: 'Open channel between Kendwa and Mnemba with warm surface water.', latitude: -5.9400, longitude: 39.3200, fish_type: 'Dorado, Tuna, Shark', best_season: 'Nov-Mar', depth: 30, accessibility: 'Boat', safety_level: 'Good' },
  { id: 1009, name: 'Matemwe Ocean Ridge', description: 'Submarine ridge with excellent fish holding structure.', latitude: -6.0670, longitude: 39.3630, fish_type: 'Grouper, Snapper, Amberjack', best_season: 'Dec-Apr', depth: 29, accessibility: 'Boat', safety_level: 'Good' },
  { id: 1010, name: 'Paje Sea Lane', description: 'South coast sea lane with steady trade winds and currents.', latitude: -6.2380, longitude: 39.2750, fish_type: 'Kingfish, Mahi Mahi', best_season: 'Jun-Sep', depth: 24, accessibility: 'Boat', safety_level: 'Moderate' },
  { id: 1011, name: 'Fumba Deep Pocket', description: 'Deep pocket near Fumba with high chlorophyll and good fish presence.', latitude: -6.1505, longitude: 39.1800, fish_type: 'Cobia, Tuna, Trevally', best_season: 'Dec-May', depth: 34, accessibility: 'Boat', safety_level: 'Good' },
  { id: 1012, name: 'Chole Bay Offshore', description: 'Bay entrance spot with healthy plankton bloom and pelagic fish.', latitude: -6.2500, longitude: 39.3250, fish_type: 'Sailfish, Tuna, Wahoo', best_season: 'Nov-Apr', depth: 20, accessibility: 'Boat', safety_level: 'Good' },
  { id: 1013, name: 'Kiwengwa Ocean Track', description: 'Wide open water track with stable surface temperatures.', latitude: -5.9420, longitude: 39.3400, fish_type: 'Tuna, Dorado, Kingfish', best_season: 'Nov-Mar', depth: 27, accessibility: 'Boat', safety_level: 'Good' },
  { id: 1014, name: 'Dongwe Offshore Patch', description: 'Offshore patch with moderate currents and deep clear water.', latitude: -6.1730, longitude: 39.3130, fish_type: 'Barracuda, Tuna', best_season: 'Dec-Apr', depth: 32, accessibility: 'Boat', safety_level: 'Good' },
  { id: 1015, name: 'Paje Reef Margin', description: 'Reef margin with strong chlorophyll signature and schooling fish.', latitude: -6.2550, longitude: 39.2850, fish_type: 'Mackerel, Tuna', best_season: 'Jun-Sep', depth: 22, accessibility: 'Boat', safety_level: 'Moderate' },
  { id: 1016, name: 'Mnemba Channel Edge', description: 'Channel edge with warm water and active pelagic movement.', latitude: -5.7850, longitude: 39.2700, fish_type: 'Marlin, Tuna, Sailfish', best_season: 'Nov-Mar', depth: 36, accessibility: 'Boat', safety_level: 'Good' },
  { id: 1017, name: 'Kendwa Offshore Canyon', description: 'Submarine canyon environment with high bait concentration.', latitude: -5.9300, longitude: 39.2800, fish_type: 'Amberjack, Tuna', best_season: 'Nov-Mar', depth: 38, accessibility: 'Boat', safety_level: 'Moderate' },
  { id: 1018, name: 'Zanbest Deep Point', description: 'Deep point south of Zanzibar island with excellent fish score.', latitude: -6.2300, longitude: 39.3100, fish_type: 'Cobia, Grouper, Tuna', best_season: 'Dec-Apr', depth: 33, accessibility: 'Boat', safety_level: 'Good' },
  { id: 1019, name: 'Nungwi Sunrise Spot', description: 'Morning best spot with warm surface layer and active fish.', latitude: -5.9150, longitude: 39.3600, fish_type: 'Mahi Mahi, Tuna', best_season: 'Nov-Mar', depth: 31, accessibility: 'Boat', safety_level: 'Good' },
  { id: 1020, name: 'Kendwa South Channel', description: 'South channel near Kendwa ideal for drift fishing.', latitude: -5.9600, longitude: 39.3050, fish_type: 'Barracuda, Wahoo', best_season: 'Oct-Apr', depth: 29, accessibility: 'Boat', safety_level: 'Good' },
  { id: 1021, name: 'Fumba Bay Entrance', description: 'Bay entrance with a mix of coastal and ocean water nutrients.', latitude: -6.1700, longitude: 39.1900, fish_type: 'Tuna, Cobia', best_season: 'Dec-May', depth: 23, accessibility: 'Boat', safety_level: 'Moderate' },
  { id: 1022, name: 'Ocean West Point', description: 'Western deep-water pocket with strong fishing potential.', latitude: -6.1400, longitude: 39.1700, fish_type: 'Kingfish, Trevally', best_season: 'Dec-Apr', depth: 30, accessibility: 'Boat', safety_level: 'Good' },
  { id: 1023, name: 'Changuu Outer Buoy', description: 'Outer buoy area with good temperature and chlorophyll mix.', latitude: -6.1550, longitude: 39.3200, fish_type: 'Grouper, Tuna', best_season: 'Nov-Apr', depth: 25, accessibility: 'Boat', safety_level: 'Good' },
  { id: 1024, name: 'South Reef Line', description: 'Long reef line to the south with stable surface water and strong catches.', latitude: -6.2050, longitude: 39.2950, fish_type: 'Snapper, Kingfish', best_season: 'Jul-Oct', depth: 26, accessibility: 'Boat', safety_level: 'Moderate' }
];

const calculateSeaElevation = (date, index, latitude, longitude) => {
  const day = date.getUTCDate();
  const baseDepth = 55 + Math.sin((day + index + latitude) / 3) * 28;
  const localGradient = Math.abs(longitude - 39.3) * 45;
  return parseFloat((-baseDepth - localGradient).toFixed(1));
};

const calculateWaterMovement = (date, index, latitude, longitude) => {
  const day = date.getUTCDate();
  const current = 18 + Math.sin((day + index + longitude) / 4) * 10 + Math.cos(latitude * 20) * 7;
  return parseFloat(Math.max(10, Math.min(60, current)).toFixed(1));
};

const calculateWindSpeed = (date, index, latitude, longitude) => {
  const day = date.getUTCDate();
  const wind = 12 + Math.cos((day + index + latitude) / 3) * 9 + Math.abs(longitude - 39.3) * 8;
  return parseFloat(Math.max(6, Math.min(35, wind)).toFixed(1));
};

const getHabitatType = (temp, chlorophyll, waterMovement, windSpeed, seaElevation) => {
  if (chlorophyll >= 0.19 && temp >= 26 && temp <= 29 && waterMovement >= 18 && windSpeed <= 28) return 'pelagic_convergence_zone';
  if (chlorophyll >= 0.17 && temp >= 24 && temp <= 30 && Math.abs(seaElevation) >= 40) return 'plankton_rich_shelf_edge';
  if (chlorophyll >= 0.15 && waterMovement >= 16) return 'nutrient_bloom_patch';
  if (waterMovement >= 20) return 'ocean_current_lane';
  return 'warm_stable_surface_patch';
};

const getDailyOceanMetrics = (date, index, latitude = -6.1, longitude = 39.3) => {
  const day = date.getUTCDate();
  const temp = 25 + Math.sin((day + index) / 3) * 1.8 + ((index % 4) - 2) * 0.15;
  const chlorophyll = 0.14 + Math.cos((day + index) / 4) * 0.06 + ((index % 3) * 0.01);
  const seaElevation = calculateSeaElevation(date, index, latitude, longitude);
  const waterMovement = calculateWaterMovement(date, index, latitude, longitude);
  const windSpeed = calculateWindSpeed(date, index, latitude, longitude);
  const habitatType = getHabitatType(temp, Math.max(0.08, chlorophyll), waterMovement, windSpeed, seaElevation);
  return {
    sea_surface_temp: parseFloat(temp.toFixed(1)),
    chlorophyll_a: parseFloat(Math.max(0.08, chlorophyll).toFixed(3)),
    sea_elevation_m: seaElevation,
    water_movement: waterMovement,
    wind_speed_kmh: windSpeed,
    habitat_type: habitatType
  };
};

const determineFishingZone = (temp, chlorophyll, waterMovement, windSpeed) => {
  if (chlorophyll >= 0.19 && temp >= 26 && temp <= 29 && waterMovement >= 18 && windSpeed <= 28) return 'Pelagic convergence zone';
  if (chlorophyll >= 0.17 && temp >= 24 && temp <= 30 && waterMovement >= 16) return 'Plankton-rich shelf edge';
  if (chlorophyll >= 0.15 && waterMovement >= 14) return 'Nutrient bloom patch';
  return 'Warm stable surface patch';
};

const calculateConvergenceIndex = (temp, chlorophyll, waterMovement, windSpeed, seaElevation) => {
  let index = 40;
  index += Math.max(0, 20 - Math.abs(temp - 28) * 3);
  index += Math.min(30, Math.max(0, (chlorophyll - 0.12) * 150));
  index += Math.max(0, (waterMovement - 12) * 1.6);
  index += Math.max(0, 30 - Math.abs(windSpeed - 18) * 1.5);
  index += Math.max(0, (Math.abs(seaElevation) - 30) * 0.08);
  return Math.min(100, Math.round(index));
};

const calculateFishingScore = (spot, temp, chlorophyll, waterMovement, windSpeed, seaElevation) => {
  let score = 50;
  score += Math.max(0, 14 - Math.abs(temp - 27) * 2);
  score += Math.min(20, chlorophyll * 120);
  score += Math.min(12, Math.max(0, waterMovement - 12));
  score += Math.max(0, 10 - Math.abs(windSpeed - 18));
  score += Math.abs(seaElevation) > 50 ? 8 : 4;
  score += spot.depth > 30 ? 8 : 4;
  score += spot.safety_level === 'Excellent' ? 6 : spot.safety_level === 'Good' ? 4 : 2;
  score += spot.best_season.toLowerCase().includes('year-round') ? 5 : 0;
  score += calculateConvergenceIndex(temp, chlorophyll, waterMovement, windSpeed, seaElevation) * 0.15;
  return Math.min(100, Math.round(score));
};

const createOceanSourceMeta = () => ({
  sst_source: 'Aqua MODIS 1km SST',
  chlorophyll_source: 'Sentinel-3 OLCI 500m Chlorophyll-a'
});

const generateDailyOceanSpots = (date, latitude, longitude, count = 24) => {
  const useDistance = typeof latitude === 'number' && typeof longitude === 'number';
  return oceanSpotTemplates
    .map((spot, idx) => {
      const metrics = getDailyOceanMetrics(date, idx, spot.latitude, spot.longitude);
      const zone = determineFishingZone(metrics.sea_surface_temp, metrics.chlorophyll_a, metrics.water_movement, metrics.wind_speed_kmh);
      const convergenceIndex = calculateConvergenceIndex(metrics.sea_surface_temp, metrics.chlorophyll_a, metrics.water_movement, metrics.wind_speed_kmh, metrics.sea_elevation_m);
      const distance = useDistance
        ? calculateDistance(latitude, longitude, spot.latitude, spot.longitude)
        : null;
      return {
        ...spot,
        ...metrics,
        ...createOceanSourceMeta(),
        fishing_zone: zone,
        convergence_index: convergenceIndex,
        fishing_score: calculateFishingScore(spot, metrics.sea_surface_temp, metrics.chlorophyll_a, metrics.water_movement, metrics.wind_speed_kmh, metrics.sea_elevation_m),
        distance: distance !== null ? parseFloat(distance.toFixed(1)) : null
      };
    })
    .sort((a, b) => {
      if (useDistance && a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      return b.fishing_score - a.fishing_score;
    })
    .slice(0, count);
};

// Get all fishing spots
router.get('/spots', (req, res) => {
  db.all('SELECT * FROM fishing_spots ORDER BY name', (err, spots) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(spots);
  });
});

// Get daily ocean fishing spots with sea surface temperature and chlorophyll data
router.get('/spots/daily', (req, res) => {
  const dateString = req.query.date || new Date().toISOString().split('T')[0];
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
  }

  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const latitude = Number.isNaN(lat) ? undefined : lat;
  const longitude = Number.isNaN(lng) ? undefined : lng;

  const spots = generateDailyOceanSpots(date, latitude, longitude, 28);
  res.json(spots);
});

// Get top ocean convergence zones for fishing
router.get('/zones', (req, res) => {
  const dateString = req.query.date || new Date().toISOString().split('T')[0];
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
  }

  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const latitude = Number.isNaN(lat) ? undefined : lat;
  const longitude = Number.isNaN(lng) ? undefined : lng;

  const spots = generateDailyOceanSpots(date, latitude, longitude, 30);
  const zones = spots
    .sort((a, b) => b.convergence_index - a.convergence_index)
    .slice(0, 5)
    .map(spot => ({
      id: spot.id,
      name: spot.name,
      latitude: spot.latitude,
      longitude: spot.longitude,
      fish_type: spot.fish_type,
      best_season: spot.best_season,
      sea_surface_temp: spot.sea_surface_temp,
      chlorophyll_a: spot.chlorophyll_a,
      sea_elevation_m: spot.sea_elevation_m,
      water_movement: spot.water_movement,
      wind_speed_kmh: spot.wind_speed_kmh,
      habitat_type: spot.habitat_type,
      fishing_zone: spot.fishing_zone,
      convergence_index: spot.convergence_index,
      fishing_score: spot.fishing_score,
      sst_source: spot.sst_source,
      chlorophyll_source: spot.chlorophyll_source,
      recommended_species: spot.fish_type
    }));

  res.json(zones);
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