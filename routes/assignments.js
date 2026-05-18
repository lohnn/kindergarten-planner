const express = require('express')
const router = express.Router()

module.exports = (db) => {
  // PUT /api/assignments/:date
  router.put('/:date', (req, res) => {
    const { date } = req.params
    const { dropoff_user_id, dropoff_time, pickup_user_id, pickup_time } = req.body

    // Validate optional user references exist
    const validateUser = (id) => {
      if (id == null) return true
      const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id)
      return !!user
    }

    if (!validateUser(dropoff_user_id) || !validateUser(pickup_user_id)) {
      return res.status(400).json({ error: 'Invalid user_id reference' })
    }

    db.prepare(`
      INSERT INTO assignments (date, dropoff_user_id, dropoff_time, pickup_user_id, pickup_time)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        dropoff_user_id = excluded.dropoff_user_id,
        dropoff_time    = excluded.dropoff_time,
        pickup_user_id  = excluded.pickup_user_id,
        pickup_time     = excluded.pickup_time
    `).run(
      date,
      dropoff_user_id ?? null,
      dropoff_time ?? null,
      pickup_user_id ?? null,
      pickup_time ?? null
    )

    const assignment = db.prepare('SELECT * FROM assignments WHERE date = ?').get(date)
    res.json(assignment)
  })

  return router
}
