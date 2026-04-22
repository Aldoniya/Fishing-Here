// filepath: server/routes/admin.js
const express = require('express');
const router = express.Router();
const { db } = require('../models/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  db.all('SELECT id, username, email, role, is_active, last_login, created_at FROM users ORDER BY created_at DESC', 
    (err, users) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(users);
    }
  );
});

// Get user count
router.get('/users/count', authenticateToken, requireAdmin, (req, res) => {
  db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ count: result.count });
  });
});

// Get active users (logged in recently)
router.get('/users/active', authenticateToken, requireAdmin, (req, res) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  db.all('SELECT id, username, email, last_login FROM users WHERE last_login > ? ORDER BY last_login DESC', 
    [oneHourAgo], (err, users) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(users);
    }
  );
});

// Get all activity logs
router.get('/activity', authenticateToken, requireAdmin, (req, res) => {
  db.all(`
    SELECT ua.*, u.username 
    FROM user_activity ua 
    LEFT JOIN users u ON ua.user_id = u.id 
    ORDER BY ua.created_at DESC 
    LIMIT 100
  `, (err, activities) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(activities);
  });
});

// Get dashboard statistics
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
  const stats = {
    total_users: 0,
    active_users: 0,
    total_spots: 0,
    total_routes: 0,
    pending_comments: 0,
    today_visits: 0
  };
  
  db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
    if (!err) stats.total_users = result.count;
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    db.get('SELECT COUNT(*) as count FROM users WHERE last_login > ?', [oneHourAgo], (err, result) => {
      if (!err) stats.active_users = result.count;
      
      db.get('SELECT COUNT(*) as count FROM fishing_spots', (err, result) => {
        if (!err) stats.total_spots = result.count;
        
        db.get('SELECT COUNT(*) as count FROM routes', (err, result) => {
          if (!err) stats.total_routes = result.count;
          
          db.get("SELECT COUNT(*) as count FROM comments WHERE status = 'pending'", (err, result) => {
            if (!err) stats.pending_comments = result.count;
            
            const today = new Date().toISOString().split('T')[0];
            db.get("SELECT COUNT(*) as count FROM user_activity WHERE created_at LIKE ?", [today + '%'], (err, result) => {
              if (!err) stats.today_visits = result.count;
              
              res.json(stats);
            });
          });
        });
      });
    });
  });
});

// Toggle user status
router.put('/users/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const { is_active } = req.body;
  
  db.run('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, req.params.id], 
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to update status' });
      res.json({ message: 'User status updated' });
    }
  );
});

// Delete user
router.delete('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to delete user' });
    res.json({ message: 'User deleted successfully' });
  });
});

// Get all fishing spots (admin)
router.get('/spots', authenticateToken, requireAdmin, (req, res) => {
  db.all('SELECT * FROM fishing_spots ORDER BY name', (err, spots) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(spots);
  });
});

// Update fishing spot
router.put('/spots/:id', authenticateToken, requireAdmin, (req, res) => {
  const { name, description, fish_type, best_season, depth, accessibility, safety_level } = req.body;
  
  db.run(
    `UPDATE fishing_spots SET name = ?, description = ?, fish_type = ?, best_season = ?, 
     depth = ?, accessibility = ?, safety_level = ?, updated_at = ? WHERE id = ?`,
    [name, description, fish_type, best_season, depth, accessibility, safety_level, new Date().toISOString(), req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to update spot' });
      res.json({ message: 'Spot updated successfully' });
    }
  );
});

// Get all routes (admin)
router.get('/routes', authenticateToken, requireAdmin, (req, res) => {
  db.all('SELECT * FROM routes ORDER BY name', (err, routes) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(routes);
  });
});

module.exports = router;