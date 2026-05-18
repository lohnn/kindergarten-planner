const express = require('express');
const router = express.Router();
const db = require('../db');

// ISO 8601 week to Monday date
function weekToMonday(year, week) {
  // Jan 4 is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7; // Mon=1..Sun=7
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (dayOfWeek - 1) + (week - 1) * 7);
  return monday;
}

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

router.get('/:year/:week', (req, res) => {
  const year = parseInt(req.params.year, 10);
  const week = parseInt(req.params.week, 10);

  if (isNaN(year) || isNaN(week) || week < 1 || week > 53) {
    return res.status(400).json({ error: 'Invalid year or week' });
  }

  const monday = weekToMonday(year, week);
  const dates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    dates.push(toDateStr(d));
  }

  const users = db.prepare('SELECT * FROM users').all();

  // Ensure day rows exist for all user/date combos
  const upsertDay = db.prepare(
    'INSERT OR IGNORE INTO days (date, user_id) VALUES (?, ?)'
  );
  for (const date of dates) {
    for (const user of users) {
      upsertDay.run(date, user.id);
    }
  }

  const getDays = db.prepare(
    'SELECT d.*, u.name FROM days d JOIN users u ON u.id = d.user_id WHERE d.date IN (' +
    dates.map(() => '?').join(',') + ') ORDER BY d.date, d.user_id'
  );
  const rows = getDays.all(...dates);

  // Group by date
  const dayMap = {};
  for (const date of dates) dayMap[date] = [];
  for (const row of rows) {
    dayMap[row.date].push(row);
  }

  const days = dates.map((date, i) => {
    const userRows = dayMap[date];
    const conflicts = [];
    const dropoffs = userRows.filter(r => r.dropoff_assigned).length;
    const pickups = userRows.filter(r => r.pickup_assigned).length;
    if (dropoffs === 0) conflicts.push('no_dropoff');
    if (dropoffs === users.length) conflicts.push('double_dropoff');
    if (pickups === 0) conflicts.push('no_pickup');
    if (pickups === users.length) conflicts.push('double_pickup');

    return {
      date,
      weekday: WEEKDAYS[i],
      conflicts,
      users: userRows.map(r => ({
        user_id: r.user_id,
        name: r.name,
        work_location: r.work_location,
        dropoff_assigned: r.dropoff_assigned === 1,
        dropoff_time: r.dropoff_time,
        pickup_assigned: r.pickup_assigned === 1,
        pickup_time: r.pickup_time
      }))
    };
  });

  res.json({ week, year, days });
});

module.exports = router;
