const express = require('express');
const router = express.Router();
const db = require('../db');

const ALLOWED_FIELDS = ['work_location', 'dropoff_assigned', 'dropoff_time', 'pickup_assigned', 'pickup_time'];

router.put('/:date/user/:userId', (req, res) => {
  const { date, userId } = req.params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format, use YYYY-MM-DD' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(parseInt(userId, 10));
  if (!user) return res.status(404).json({ error: 'User not found' });

  const body = req.body;
  const fields = Object.keys(body).filter(k => ALLOWED_FIELDS.includes(k));
  if (fields.length === 0) return res.status(400).json({ error: 'No valid fields provided' });

  // Ensure row exists
  db.prepare('INSERT OR IGNORE INTO days (date, user_id) VALUES (?, ?)').run(date, user.id);

  const setClauses = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => {
    if (f === 'dropoff_assigned' || f === 'pickup_assigned') return body[f] ? 1 : 0;
    return body[f];
  });

  db.prepare(`UPDATE days SET ${setClauses} WHERE date = ? AND user_id = ?`).run(...values, date, user.id);

  const row = db.prepare('SELECT * FROM days WHERE date = ? AND user_id = ?').get(date, user.id);
  res.json({
    ...row,
    dropoff_assigned: row.dropoff_assigned === 1,
    pickup_assigned: row.pickup_assigned === 1
  });
});

module.exports = router;
