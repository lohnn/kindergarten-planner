# Kindergarten Planner

A self-hosted web app for two adults to coordinate kindergarten drop-off and pick-up scheduling alongside WFH/office day tracking. Runs on a Raspberry Pi 4 via Docker Compose, accessible over Tailscale.

## Features

- Weekly calendar view (Mon–Fri) with swipe/arrow navigation
- Per-person WFH / Office / Unknown toggle per day (tap cell → popup)
- Drop-off and pick-up assignment — tap cell → select person, backend auto-fills default time
- Conflict detection — warns when nobody is assigned or both are assigned to the same slot
- "I am" person selector in the header — no login required
- Today column highlighted with amber tint; jump-to-today button when viewing another week
- Tap a day header → full day editor (all settings for that day in one sheet)
- Settings page — rename users, manage occasional people, set default times, light/dark/system theme
- Light and dark themes (system default, user-overridable)
- Mobile-friendly responsive layout

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Backend   | Node.js, Express 5, SQLite (better-sqlite3) |
| Frontend  | Flutter web (Dart, Riverpod 3)          |
| Proxy     | Traefik v3                              |
| Deploy    | Docker Compose, Raspberry Pi 4 (ARM64)  |

## Project Structure

```
├── server.js              # Express API server — serves API + Flutter static files
├── db.js                  # SQLite schema, migrations, and seed data
├── routes/
│   ├── weeks.js           # GET /api/weeks/:year/:week
│   ├── days.js            # PUT /api/days/:date/user/:userId
│   ├── users.js           # GET/POST/PUT/DELETE /api/users
│   ├── assignments.js     # PUT /api/assignments/:date (partial updates)
│   └── settings.js        # GET/PUT /api/settings (default times)
├── flutter/
│   ├── lib/               # Flutter app source
│   │   ├── main.dart
│   │   ├── app.dart
│   │   ├── models/        # User, Day, Week
│   │   ├── providers/     # Riverpod 3 providers
│   │   ├── services/      # ApiService (HTTP client)
│   │   ├── screens/       # HomeScreen, SettingsScreen
│   │   ├── widgets/       # WeekGrid, Header, LocationCell, AssignmentCell, etc.
│   │   └── theme/         # Light + dark ThemeData, color constants
│   ├── test/golden/       # Visual regression tests (flutter test --update-goldens)
│   ├── build/web/         # Pre-built Flutter web output (committed, served by Express)
│   └── pubspec.yaml
├── hooks/
│   └── pre-push           # Rebuilds flutter/build/web/ before every push
├── snapshots/             # React Satori snapshot pipeline (design reference)
│   ├── output/            # Generated PNGs: 390/768/1024 × light/dark
│   └── render.mjs         # Snapshot renderer
├── src/                   # Original React frontend (kept for reference / snapshot rendering)
├── Dockerfile             # Node.js only — copies flutter/build/web/ as static files
├── docker-compose.yml     # traefik + app (single container)
├── setup-hooks.sh         # Run once per clone to enable git hooks
├── data/                  # SQLite DB (gitignored, volume-mounted on Pi)
└── deploy/README.md       # Deployment guide
```

## REST API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/weeks/:year/:week` | Full week data — days, work locations, assignments, conflicts, users |
| PUT | `/api/days/:date/user/:userId` | Set work location. Body: `{ work_location: "home"\|"office"\|"unknown" }` |
| PUT | `/api/assignments/:date` | Partial upsert. Send only changed fields: `{ dropoff_user_id?, dropoff_time?, pickup_user_id?, pickup_time?, note? }`. Omitted fields keep their existing values; assigning a user without a time auto-fills the default time. |
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create occasional user. Body: `{ name, type: "occasional" }` |
| PUT | `/api/users/:id` | Rename user. Body: `{ name }` |
| DELETE | `/api/users/:id` | Delete occasional user (primary users cannot be deleted) |
| GET | `/api/settings` | Get settings: `{ default_dropoff_time, default_pickup_time }` |
| PUT | `/api/settings` | Update settings. Body: `{ default_dropoff_time?, default_pickup_time? }` |

## Local Development

### Backend

```bash
npm install
node server.js
# API available at http://localhost:3000
# Serves Flutter build from flutter/build/web/ if present
```

### Flutter frontend

```bash
cd flutter
flutter pub get
flutter run -d chrome          # dev server with hot reload
flutter build web --release    # production build → build/web/
flutter test test/golden/      # run visual regression tests
flutter test --update-goldens test/golden/  # regenerate golden images
```

### Visual snapshots (React design reference)

```bash
node snapshots/run-snapshots.js
# Generates snapshots/output/{390,768,1024}-{light,dark}.png
```

## Deployment

See [`deploy/README.md`](deploy/README.md) for full instructions.

The short version on the Pi:

```bash
git pull && docker compose up -d --build --remove-orphans
```

> **Note:** Always use `--remove-orphans` when deploying after service renames or removals. Without it, old containers with Traefik labels persist and silently intercept routes.

## Git Hooks

Run once after cloning to enable the pre-push hook:

```bash
./setup-hooks.sh
```

The hook automatically runs `flutter build web --release` before each push and amends the commit if the output changed. This ensures the Pi always receives a fresh build without needing Flutter installed there.
