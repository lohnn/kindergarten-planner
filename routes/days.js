const express = require('express');
const router = express.Router();
const db = require('../db');

// PUT /api/days/:date/user/:userId — WFH updates only (primary users)
router.put('/:date/user/:userId', (req, res) => {
  const { date, userId } = req.params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format, use YYYY-MM-DD' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(parseInt(userId, 10));
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.type !== 'primary') return res.status(400).json({ error: 'Only primary users have WFH tracking' });

  const { work_location } = req.body;
  if (!work_location || !['home', 'office', 'unknown'].includes(work_location)) {
    return res.status(400).json({ error: 'work_location must be "home", "office", or "unknown"' });
  }

  db.prepare(
    'INSERT OR IGNORE INTO days (date, user_id, work_location) VALUES (?, ?, ?)'
  ).run(date, user.id, 'unknown');
  db.prepare('UPDATE days SET work_location = ? WHERE date = ? AND user_id = ?').run(work_location, date, user.id);

  const row = db.prepare('SELECT * FROM days WHERE date = ? AND user_id = ?').get(date, user.id);
  res.json(row);
});

module.exports = router;
