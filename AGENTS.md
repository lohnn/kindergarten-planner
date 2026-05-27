# Agent Instructions — Kindergarten Planner

## After Every Iteration

After completing any set of changes, always commit and push to `main`:

```bash
git add -A
git commit -m "<concise description of changes>"
git push
```

Do not leave changes uncommitted between iterations.

---

## Project Overview

A self-hosted family scheduling tool. Two primary users (a couple) coordinate kindergarten drop-off/pick-up and WFH/office days. Deployed on a Raspberry Pi 4 behind Tailscale.

**Stack:**
- Backend: Node.js + Express 5 + SQLite (`better-sqlite3`)
- Frontend: Flutter web, Riverpod 3, served as static files by Express
- Proxy: Traefik v3 (Docker labels, no config files)
- Deploy: Single Docker container (Express serves API + Flutter static files)

---

## Architecture

### Single Container
Express serves both the API (`/api/*`) and the Flutter web build (`flutter/build/web/`) as static files with SPA fallback. **No separate frontend container.** Traefik sits in front on port 80.

### Flutter Build Strategy
The Flutter web build is **pre-built on the dev machine** and committed to `flutter/build/web/`. The Dockerfile copies it directly — no Flutter SDK needed on the Pi. A `pre-push` git hook rebuilds automatically. Run `./setup-hooks.sh` once per clone to enable it.

### Partial API Updates
`PUT /api/assignments/:date` accepts partial updates — only send the fields being changed. The backend merges with existing state and auto-fills default times when a user is assigned without specifying a time. Never send all fields when only one changed.

---

## Key Files

| File | Purpose |
|------|---------|
| `server.js` | Express entry point, route registration, static serving |
| `db.js` | Schema creation, migrations, seed data |
| `routes/assignments.js` | Partial-update assignment logic |
| `routes/settings.js` | Default times API |
| `flutter/lib/services/api_service.dart` | All HTTP calls to the backend |
| `flutter/lib/theme/colors.dart` | Color constants (light + dark) |
| `flutter/lib/widgets/week_grid.dart` | Main weekly grid widget |
| `flutter/test/golden/` | Visual regression tests |
| `snapshots/output/` | React design reference PNGs |

---

## Design Constraints (from collective memory)

1. **Color separation**: Identity colors (who the person is) and state colors (what the cell means) must NOT share hue space. Blue = Mama, Fuchsia = Papa. Green = WFH, Red = Office.

2. **Cell-level interactions**: Tapping a location or assignment cell opens a small popup scoped to that cell. Full day editing is via the day header tap → bottom sheet.

3. **Smart popup positioning**: Use `showMenu` anchored to the tap position. Don't hardcode offsets.

4. **Dark mode**: Both themes are independently designed. Don't derive dark from light by darkening.

5. **Partial updates**: Never overwrite the whole assignment record when only one field changed.

---

## Deployment

On the Pi:

```bash
git pull && docker compose up -d --build --remove-orphans
```

**Always use `--remove-orphans`.** Without it, stale containers from old service names persist with their Traefik labels and intercept routes. The symptom is a 404 that works inside the container but not through Traefik.

---

## Testing

```bash
# Visual regression (Flutter)
cd flutter && flutter test test/golden/
flutter test --update-goldens test/golden/  # regenerate

# React design reference snapshots
node snapshots/run-snapshots.js
```

Compare `flutter/test/golden/goldens/` against `snapshots/output/` to check design alignment.

---

## Database Schema

```sql
users        (id, name, type)                          -- type: 'primary' | 'occasional'
days         (id, date, user_id, work_location)        -- work_location: 'home' | 'office' | 'unknown'
assignments  (id, date, dropoff_user_id, dropoff_time, pickup_user_id, pickup_time, note)
settings     (key, value)                              -- default_dropoff_time, default_pickup_time
```

Primary users seeded with id 1 and 2. Primary users cannot be deleted.
