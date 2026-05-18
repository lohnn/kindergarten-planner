const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'schedule.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    work_location TEXT NOT NULL DEFAULT 'home',
    dropoff_assigned INTEGER NOT NULL DEFAULT 0,
    dropoff_time TEXT,
    pickup_assigned INTEGER NOT NULL DEFAULT 0,
    pickup_time TEXT,
    UNIQUE(date, user_id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed users if not present
const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)');
insertUser.run(1, 'Person A');
insertUser.run(2, 'Person B');

module.exports = db;
