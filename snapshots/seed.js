/**
 * Seeds the database with known test data for snapshot testing.
 * Creates: Mama (id=1), Papa (id=2), Oma (occasional), and a week of schedule data.
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'schedule.db');

// Remove existing DB for clean state
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'primary'
  );
  CREATE TABLE IF NOT EXISTS days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    work_location TEXT NOT NULL DEFAULT 'unknown',
    UNIQUE(date, user_id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    dropoff_user_id INTEGER,
    dropoff_time TEXT,
    pickup_user_id INTEGER,
    pickup_time TEXT,
    note TEXT,
    FOREIGN KEY(dropoff_user_id) REFERENCES users(id),
    FOREIGN KEY(pickup_user_id) REFERENCES users(id)
  );
`);

// Users
db.prepare('INSERT INTO users (id, name, type) VALUES (?, ?, ?)').run(1, 'Mama', 'primary');
db.prepare('INSERT INTO users (id, name, type) VALUES (?, ?, ?)').run(2, 'Papa', 'primary');
db.prepare('INSERT INTO users (id, name, type) VALUES (?, ?, ?)').run(3, 'Oma', 'occasional');

// Week 21 of 2026: May 18-22 (Mon-Fri)
const dates = ['2026-05-18', '2026-05-19', '2026-05-20', '2026-05-21', '2026-05-22'];

// Work locations
const locations = [
  // Mon: Mama WFH, Papa Office
  { date: dates[0], user_id: 1, work_location: 'home' },
  { date: dates[0], user_id: 2, work_location: 'office' },
  // Tue: Mama Office, Papa WFH
  { date: dates[1], user_id: 1, work_location: 'office' },
  { date: dates[1], user_id: 2, work_location: 'home' },
  // Wed: Mama WFH, Papa Office
  { date: dates[2], user_id: 1, work_location: 'home' },
  { date: dates[2], user_id: 2, work_location: 'office' },
  // Thu: Both Office (conflict scenario - nobody assigned pickup)
  { date: dates[3], user_id: 1, work_location: 'office' },
  { date: dates[3], user_id: 2, work_location: 'office' },
  // Fri: Mama WFH, Papa WFH
  { date: dates[4], user_id: 1, work_location: 'home' },
  { date: dates[4], user_id: 2, work_location: 'home' },
];

const insertDay = db.prepare('INSERT INTO days (date, user_id, work_location) VALUES (?, ?, ?)');
for (const loc of locations) {
  insertDay.run(loc.date, loc.user_id, loc.work_location);
}

// Assignments
const insertAssignment = db.prepare(
  'INSERT INTO assignments (date, dropoff_user_id, dropoff_time, pickup_user_id, pickup_time, note) VALUES (?, ?, ?, ?, ?, ?)'
);
// Mon: Mama drops off, Papa picks up
insertAssignment.run(dates[0], 1, '08:00', 2, '15:30', null);
// Tue: Papa drops off, Mama picks up
insertAssignment.run(dates[1], 2, '08:15', 1, '15:00', null);
// Wed: Mama drops off, Oma picks up
insertAssignment.run(dates[2], 1, '08:00', 3, '14:00', null);
// Thu: CONFLICT - nobody assigned for either (both at office, forgot to plan)
insertAssignment.run(dates[3], null, null, null, null, 'Remember to take the kid to the doctor.');
// Fri: Papa drops off, Mama picks up
insertAssignment.run(dates[4], 2, '08:30', 1, '15:00', null);

db.close();
console.log('Database seeded successfully for week 21/2026');
