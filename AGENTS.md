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
- Frontend: Flutter web, Riverpod 3.2.1, served as static files by Express
- Realtime: Server-Sent Events (SSE) — server pushes changed records, clients merge live
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

### Realtime Sync (SSE)
The two partners see each other's edits live. The mechanism:

- **Transport:** Server-Sent Events over `GET /api/events` — added directly to the existing Express server (no second service, no Traefik change). Plain HTTP, no library; the SSE hub lives in `events.js`.
- **Flow:** Clients still mutate via the normal REST endpoints. After each successful write, the route handler calls `events.broadcast(type, record)` to push the changed record to all *other* connected clients. Clients **merge the partial payload field-by-field** into in-memory Riverpod state — they do NOT refetch the week per event, so open popups and in-flight local edits are not disrupted (mirrors the partial-update PATCH discipline).
- **Event contract** (documented at the top of `events.js`): named SSE events `assignment` / `day` / `settings`, each carrying the same record shape the corresponding `PUT` returns. Keep-alive comment frames (`:`-prefixed) every ~25s; an initial `: connected` comment. Comment frames are ignored by clients.
- **Lifecycle:** The Flutter client uses the browser-native `EventSource` (via `package:web` + `dart:js_interop`) for named events + automatic reconnection. Tab visibility drives the connection via the DOM `visibilitychange` event: **hidden → close the stream** (frees the server resource), **visible → refetch the current week once (catch up), then reopen**. `WidgetsBindingObserver` is NOT used — it is unreliable for browser tab visibility.

### State Management (Riverpod 3.x)
The app uses **Riverpod 3.2.1** with **no code generation** (`riverpod_annotation` / `riverpod_generator` / `build_runner` are intentionally not used — they have no 3.2.1 release and the project uses no `@riverpod`/`.g.dart`). Providers use the modern `Notifier` / `AsyncNotifier` API:

- `weekProvider` and `settingsProvider` are `AsyncNotifier`s (not `FutureProvider`s) so the realtime layer can surgically merge SSE events into a single day in place via `mergeAssignment` / `mergeDay` / `mergeSettings`.
- `currentWeekIndexProvider`, `themeProvider`, `activeUserProvider` are `Notifier`s (migrated from the legacy `StateProvider`/`StateNotifier`).
- `realtimeProvider` (`ref.keepAlive`'d) owns the SSE service lifecycle and routes events into the notifiers. `realtimeStatusProvider` exposes connection status for the UI indicator.
- Note for migrations: `AsyncValue.valueOrNull` is removed in 3.x → use `.value`; `StateProvider`/`StateNotifier` are legacy (`legacy.dart` import).

---

## Key Files

| File | Purpose |
|------|---------|
| `server.js` | Express entry point, route registration, static serving, `GET /api/events` SSE endpoint |
| `events.js` | SSE hub — connected-client set, broadcast(), keep-alive, event contract |
| `db.js` | Schema creation, migrations, seed data |
| `routes/assignments.js` | Partial-update assignment logic (+ broadcasts `assignment` events) |
| `routes/days.js` | WFH/location updates (+ broadcasts `day` events) |
| `routes/settings.js` | Default times API (+ broadcasts `settings` events) |
| `flutter/lib/services/api_service.dart` | All HTTP calls to the backend |
| `flutter/lib/services/realtime_service.dart` | SSE client interface + conditional-import factory (web impl / VM stub) |
| `flutter/lib/services/realtime_service_web.dart` | Browser `EventSource` impl + visibility lifecycle |
| `flutter/lib/providers/realtime_provider.dart` | SSE lifecycle owner; routes events into notifiers; `realtimeStatusProvider` |
| `flutter/lib/providers/week_provider.dart` | `weekProvider`/`settingsProvider` AsyncNotifiers with field-by-field merge |
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

5. **Partial updates**: Never overwrite the whole assignment record when only one field changed. This applies to incoming SSE events too — merge field-by-field, never replace the record (would disrupt open popups / in-flight edits).

6. **Connection-state indicators**: The realtime/connection status indicator must not rely on color alone (pair with icon shape, label, or tooltip) and must not reuse the identity (Blue/Fuchsia) or WFH/office (Green/Red) hues in a confusing way. Design both themes properly (see constraint 4).

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
