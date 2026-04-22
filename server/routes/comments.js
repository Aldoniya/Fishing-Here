// filepath: server/routes/comments.js
const express = require('express');
const router = express.Router();
const { db } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

// Submit a comment
router.post('/', authenticateToken, (req, res) => {
  const { subject, message } = req.body;
  
  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }
  
  db.run(
    'INSERT INTO comments (user_id, subject, message, status) VALUES (?, ?, ?, ?)',
    [req.user.id, subject, message, 'pending'],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to submit comment' });
      res.status(201).json({ message: 'Comment submitted successfully', id: this.lastID });
    }
  );
});

// Get user's comments
router.get('/my', authenticateToken, (req, res) => {
  db.all('SELECT * FROM comments WHERE user_id = ? ORDER BY created_at DESC', 
    [req.user.id], (err, comments) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(comments);
    }
  );
});

// Get all comments (admin)
router.get('/all', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  
  db.all(`
    SELECT c.*, u.username 
    FROM comments c 
    LEFT JOIN users u ON c.user_id = u.id 
    ORDER BY c.created_at DESC
  `, (err, comments) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(comments);
  });
});

// Get pending comments count (admin)
router.get('/pending/count', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  
  db.get("SELECT COUNT(*) as count FROM comments WHERE status = 'pending'", (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ count: result.count });
  });
});

// Respond to comment (admin)
router.put('/:id/respond', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  
  const { response } = req.body;
  
  db.run(
    "UPDATE comments SET admin_response = ?, status = 'responded' WHERE id = ?",
    [response, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to respond' });
      res.json({ message: 'Response added successfully' });
    }
  );
});

// Delete comment
router.delete('/:id', authenticateToken, (req, res) => {
  // User can delete their own, admin can delete any
  if (req.user.role !== 'admin') {
    db.get('SELECT user_id FROM comments WHERE id = ?', [req.params.id], (err, comment) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!comment) return res.status(404).json({ error: 'Comment not found' });
      if (comment.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      db.run('DELETE FROM comments WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to delete' });
        res.json({ message: 'Comment deleted' });
      });
    });
  } else {
    db.run('DELETE FROM comments WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to delete' });
      res.json({ message: 'Comment deleted' });
    });
  }
});

module.exports = router;