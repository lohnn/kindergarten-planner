const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'schedule.db'));

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
    work_location TEXT NOT NULL DEFAULT 'home',
    UNIQUE(date, user_id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    dropoff_user_id INTEGER,
    dropoff_time TEXT,
    pickup_user_id INTEGER,
    pickup_time TEXT,
    FOREIGN KEY(dropoff_user_id) REFERENCES users(id),
    FOREIGN KEY(pickup_user_id) REFERENCES users(id)
  );
`);

// Migration: add type column to users if missing
const userCols = db.pragma('table_info(users)').map(c => c.name);
if (!userCols.includes('type')) {
  db.exec(`ALTER TABLE users ADD COLUMN type TEXT NOT NULL DEFAULT 'primary'`);
}

// Migration: handle old days table that may have dropoff/pickup columns
// (we just leave extra columns — SQLite ignores them harmlessly)

// Seed primary users if not present
const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, name, type) VALUES (?, ?, ?)');
insertUser.run(1, 'Person A', 'primary');
insertUser.run(2, 'Person B', 'primary');

// Seed default settings
const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
insertSetting.run('default_dropoff_time', '08:00');
insertSetting.run('default_pickup_time', '15:00');

module.exports = db;
