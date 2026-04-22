// filepath: server/models/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const initialize = (callback) => {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      is_active INTEGER DEFAULT 1,
      last_login TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Fishing spots table
    db.run(`CREATE TABLE IF NOT EXISTS fishing_spots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      fish_type TEXT,
      best_season TEXT,
      depth REAL,
      accessibility TEXT,
      safety_level TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Weather data table
    db.run(`CREATE TABLE IF NOT EXISTS weather_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spot_id INTEGER,
      date TEXT NOT NULL,
      temperature REAL,
      humidity REAL,
      wind_speed REAL,
      wind_direction TEXT,
      precipitation REAL,
      wave_height REAL,
      visibility REAL,
      conditions TEXT,
      FOREIGN KEY (spot_id) REFERENCES fishing_spots(id)
    )`);

    // User visits/activity table
    db.run(`CREATE TABLE IF NOT EXISTS user_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Comments table
    db.run(`CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      admin_response TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Routes table
    db.run(`CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_lat REAL NOT NULL,
      start_lng REAL NOT NULL,
      end_lat REAL NOT NULL,
      end_lng REAL NOT NULL,
      waypoints TEXT,
      distance REAL,
      estimated_time INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Seed initial fishing spots for Zanzibar
    seedFishingSpots();
    
    console.log('✅ Database initialized successfully');
    if (callback) callback();
  });
};

const seedFishingSpots = () => {
  const spots = [
    { name: 'Mnemba Island', lat: -5.7833, lng: 39.2667, fish: 'Groupers, Snapper, Barracuda', season: 'Oct-Mar', depth: 15, access: 'Boat only', safety: 'Good' },
    { name: 'Kankadya Reef', lat: -6.1659, lng: 39.1989, fish: 'Tuna, Marlin, Wahoo', season: 'Jun-Sep', depth: 25, access: 'Boat only', safety: 'Moderate' },
    { name: 'Pwani Mchangani', lat: -6.0833, lng: 39.3333, fish: 'Mackerel, Sardines', season: 'Year-round', depth: 8, access: 'Shore/Boat', safety: 'Good' },
    { name: 'Kibbuti Bay', lat: -6.2333, lng: 39.1833, fish: 'Cobia, Kingfish', season: 'Apr-Oct', depth: 12, access: 'Boat only', safety: 'Good' },
    { name: 'Fumba Peninsula', lat: -6.1333, lng: 39.2333, fish: 'Snapper, Grouper', season: 'Nov-Apr', depth: 10, access: 'Shore/Boat', safety: 'Good' },
    { name: 'Changuu Island', lat: -6.1500, lng: 39.3167, fish: 'Parrotfish, Rabbitfish', season: 'Year-round', depth: 6, access: 'Snorkel/Boat', safety: 'Excellent' },
    { name: 'Nungwi Bay', lat: -5.9333, lng: 39.3000, fish: 'Marlin, Sailfish', season: 'Dec-Apr', depth: 30, access: 'Boat only', safety: 'Good' },
    { name: 'Kendwa Beach', lat: -5.9500, lng: 39.2833, fish: 'Tuna, Dorado', season: 'Nov-Mar', depth: 20, access: 'Boat only', safety: 'Good' },
    { name: 'Matemwe', lat: -6.0667, lng: 39.3500, fish: 'Barracuda, Jacks', season: 'Year-round', depth: 14, access: 'Boat only', safety: 'Moderate' },
    { name: 'Jozani Bay', lat: -6.2833, lng: 39.4000, fish: 'Milkfish, Mullet', season: 'Jun-Dec', depth: 5, access: 'Shore/Boat', safety: 'Good' }
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO fishing_spots 
    (name, latitude, longitude, fish_type, best_season, depth, accessibility, safety_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  spots.forEach(spot => {
    stmt.run(spot.name, spot.lat, spot.lng, spot.fish, spot.season, spot.depth, spot.access, spot.safety);
  });

  stmt.finalize();
  console.log('🌊 Seeded 10 fishing spots for Zanzibar');
};

module.exports = { db, initialize };