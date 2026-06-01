const express = require('express');
const router = express.Router();
const db = require('../db');
const events = require('../events');

// PUT /api/assignments/:date — partial update support
router.put('/:date', (req, res) => {
  const { date } = req.params;
  const body = req.body;

  // Validate optional user references exist
  const validateUser = (id) => {
    if (id == null) return true;
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    return !!user;
  };

  if ('dropoff_user_id' in body && !validateUser(body.dropoff_user_id)) {
    return res.status(400).json({ error: 'Invalid user_id reference' });
  }
  if ('pickup_user_id' in body && !validateUser(body.pickup_user_id)) {
    return res.status(400).json({ error: 'Invalid user_id reference' });
  }

  // Get existing assignment
  const existing = db.prepare('SELECT * FROM assignments WHERE date = ?').get(date) || {
    dropoff_user_id: null, dropoff_time: null, pickup_user_id: null, pickup_time: null, note: null
  };

  // Merge: use request value if key present, otherwise keep existing
  const field = (key) => key in body ? body[key] : existing[key];

  let dropoff_user_id = field('dropoff_user_id');
  let dropoff_time = field('dropoff_time');
  let pickup_user_id = field('pickup_user_id');
  let pickup_time = field('pickup_time');
  let note = field('note');

  // Auto-fill defaults: if user is being set and time is null, use default
  const getSetting = (key) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
  };

  if (dropoff_user_id != null && dropoff_time == null) {
    dropoff_time = getSetting('default_dropoff_time');
  }
  if (pickup_user_id != null && pickup_time == null) {
    pickup_time = getSetting('default_pickup_time');
  }

  db.prepare(`
    INSERT INTO assignments (date, dropoff_user_id, dropoff_time, pickup_user_id, pickup_time, note)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      dropoff_user_id = excluded.dropoff_user_id,
      dropoff_time    = excluded.dropoff_time,
      pickup_user_id  = excluded.pickup_user_id,
      pickup_time     = excluded.pickup_time,
      note            = excluded.note
  `).run(date, dropoff_user_id ?? null, dropoff_time ?? null, pickup_user_id ?? null, pickup_time ?? null, note ?? null);

  const assignment = db.prepare('SELECT * FROM assignments WHERE date = ?').get(date);
  // Broadcast the changed record to other connected clients (date locates the cell).
  events.broadcast('assignment', assignment);
  res.json(assignment);
});

module.exports = router;
