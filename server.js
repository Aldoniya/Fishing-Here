// filepath: server.js
const express = require('express');
// Load environment variables from .env in development
try { require('dotenv').config(); } catch (e) { /* ignore if dotenv not installed */ }
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const authRoutes = require('./server/routes/auth');
const userRoutes = require('./server/routes/users');
const fishingRoutes = require('./server/routes/fishing');
const weatherRoutes = require('./server/routes/weather');
const adminRoutes = require('./server/routes/admin');
const commentRoutes = require('./server/routes/comments');

const app = express();
const PORT = process.env.PORT || 3000;

// Warn if OpenWeatherMap key is not configured
if (!process.env.OPENWEATHER_API_KEY) {
  console.warn('Warning: OPENWEATHER_API_KEY is not set. Weather animation proxy will be disabled until you set it.');
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org", "https://*.openstreetmap.org", "https://*.opentopomap.org", "https://*.arcgisonline.com", "https://services.arcgisonline.com", "https://server.arcgisonline.com", "https://gibs.earthdata.nasa.gov", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'", "https://api.openweathermap.org", "https://nominatim.openstreetmap.org", "https://*.tile.openstreetmap.org", "https://*.opentopomap.org", "https://services.arcgisonline.com", "https://gibs.earthdata.nasa.gov"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fishing', fishingRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentRoutes);

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/map', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'map.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/weather', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'weather.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Page not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database and start server
const db = require('./server/models/database');

db.initialize(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Zanzibar Fishing Hotspot Server running on http://localhost:${PORT}`);
    console.log(`📍 Admin panel: http://localhost:${PORT}/admin`);
  });
});

module.exports = app;