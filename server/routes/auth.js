// filepath: server/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../models/database');
const { generateToken, logActivity } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], async (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (user) return res.status(400).json({ error: 'User already exists' });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      db.run(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, 'user'],
        function(err) {
          if (err) return res.status(500).json({ error: 'Failed to create user' });

          const token = generateToken({ id: this.lastID, username, email, role: 'user' });
          res.status(201).json({ 
            message: 'User registered successfully', 
            token, 
            user: { id: this.lastID, username, email, role: 'user' } 
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check for either email OR username
    db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, email], async (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

      // Update last login
      db.run('UPDATE users SET last_login = ? WHERE id = ?', [new Date().toISOString(), user.id]);

      // Log activity
      logActivity(user.id, 'login', 'User logged in', req.ip);

      const token = generateToken(user);
      res.json({ 
        message: 'Login successful', 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role 
        } 
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No token provided' });

  const jwt = require('jsonwebtoken');
  const { JWT_SECRET } = require('../middleware/auth');

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    res.json({ user });
  });
});

module.exports = router;