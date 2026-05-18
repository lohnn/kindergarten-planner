const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY type DESC, id ASC').all();
  res.json(users);
});

router.post('/', (req, res) => {
  const { name, type } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (type && type !== 'occasional') {
    return res.status(400).json({ error: 'POST only allows type=occasional' });
  }
  const result = db.prepare('INSERT INTO users (name, type) VALUES (?, ?)').run(name.trim(), 'occasional');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(user);
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const result = db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), id);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
  res.json(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.type === 'primary') return res.status(403).json({ error: 'Cannot delete primary users' });
  db.prepare('UPDATE assignments SET dropoff_user_id = NULL WHERE dropoff_user_id = ?').run(id);
  db.prepare('UPDATE assignments SET pickup_user_id = NULL WHERE pickup_user_id = ?').run(id);
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ deleted: true, id });
});

module.exports = router;
