// filepath: server/routes/users.js
const express = require('express');
const router = express.Router();
const { db } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, username, email, role, last_login, created_at FROM users WHERE id = ?', 
    [req.user.id], (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    }
  );
});

// Update profile
router.put('/profile', authenticateToken, (req, res) => {
  const { username, email } = req.body;
  
  db.run(
    'UPDATE users SET username = ?, email = ? WHERE id = ?',
    [username, email, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to update profile' });
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// Get user activity
router.get('/activity', authenticateToken, (req, res) => {
  db.all('SELECT * FROM user_activity WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', 
    [req.user.id], (err, activities) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(activities);
    }
  );
});

module.exports = router;