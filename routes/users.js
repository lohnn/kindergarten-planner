const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users);
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

module.exports = router;
