// filepath: server/middleware/auth.js
const jwt = require('jsonwebtoken');
const { db } = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'zanzibar_fishing_secret_key_2024';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const logActivity = (userId, action, details, ip) => {
  const stmt = db.prepare(`
    INSERT INTO user_activity (user_id, action, details, ip_address)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(userId, action, details, ip);
  stmt.finalize();
};

module.exports = { authenticateToken, requireAdmin, generateToken, logActivity, JWT_SECRET };