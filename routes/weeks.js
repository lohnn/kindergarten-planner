const express = require('express');
const router = express.Router();
const db = require('../db');

// ISO 8601 week to Monday date
function weekToMonday(year, week) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
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

  const allUsers = db.prepare('SELECT * FROM users ORDER BY type DESC, id ASC').all();
  const primaryUsers = allUsers.filter(u => u.type === 'primary');

  // Build user lookup map
  const userMap = {};
  for (const u of allUsers) userMap[u.id] = u;

  // Ensure day rows exist for primary users only
  const upsertDay = db.prepare('INSERT OR IGNORE INTO days (date, user_id) VALUES (?, ?)');
  for (const date of dates) {
    for (const user of primaryUsers) {
      upsertDay.run(date, user.id);
    }
  }

  // Fetch WFH rows for primary users
  const wfhRows = db.prepare(
    'SELECT d.date, d.user_id, d.work_location, u.name FROM days d JOIN users u ON u.id = d.user_id WHERE d.date IN (' +
    dates.map(() => '?').join(',') + ') ORDER BY d.date, d.user_id'
  ).all(...dates);

  // Fetch assignments
  const assignmentRows = db.prepare(
    'SELECT * FROM assignments WHERE date IN (' + dates.map(() => '?').join(',') + ')'
  ).all(...dates);
  const assignmentMap = {};
  for (const a of assignmentRows) assignmentMap[a.date] = a;

  // Group WFH by date
  const wfhMap = {};
  for (const date of dates) wfhMap[date] = [];
  for (const row of wfhRows) wfhMap[row.date].push(row);

  const days = dates.map((date, i) => {
    const assignment = assignmentMap[date] || null;
    const conflicts = [];
    if (!assignment || assignment.dropoff_user_id == null) conflicts.push('no_dropoff');
    if (!assignment || assignment.pickup_user_id == null) conflicts.push('no_pickup');

    const dropoffUser = assignment && assignment.dropoff_user_id != null
      ? { user_id: assignment.dropoff_user_id, name: userMap[assignment.dropoff_user_id]?.name ?? null, time: assignment.dropoff_time }
      : null;
    const pickupUser = assignment && assignment.pickup_user_id != null
      ? { user_id: assignment.pickup_user_id, name: userMap[assignment.pickup_user_id]?.name ?? null, time: assignment.pickup_time }
      : null;

    return {
      date,
      weekday: WEEKDAYS[i],
      conflicts,
      work_locations: wfhMap[date].map(r => ({
        user_id: r.user_id,
        name: r.name,
        work_location: r.work_location
      })),
      dropoff: dropoffUser,
      pickup: pickupUser
    };
  });

  res.json({ week, year, users: allUsers, days });
});

module.exports = router;
