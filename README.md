# Kindergarten Planner

A self-hosted web app for two adults to coordinate kindergarten drop-off and pick-up scheduling alongside WFH/office day tracking. Designed to run on a Raspberry Pi 4 via Docker Compose.

<!-- Screenshot: add a screenshot of the weekly calendar view here -->

## Features

- Weekly calendar view (Mon–Fri)
- Per-person WFH / office toggle per day
- Drop-off and pick-up assignment — who is responsible and at what time
- Conflict detection — warns when nobody is assigned or both are assigned to the same task
- "I am" person selector — no login required, just pick who you are
- Mobile-friendly layout

## Getting Started (local dev)

```bash
npm install
node server.js
```

The app will be available at `http://localhost:3000` by default.

## Deployment

Full instructions are in [`deploy/README.md`](deploy/README.md). The short version:

```bash
docker compose up -d
```

Includes an nginx reverse proxy. Intended to run on a Raspberry Pi 4 (ARM).

## Tech Stack

| Layer     | Technology                     |
|-----------|--------------------------------|
| Backend   | Node.js, Express               |
| Database  | SQLite via better-sqlite3      |
| Frontend  | Vanilla HTML / CSS / JS        |
| Proxy     | nginx                          |
| Deploy    | Docker Compose                 |

## Project Structure

```
├── server.js              # Entry point
├── db.js                  # Database setup and helpers
├── routes/                # Express route handlers
├── public/                # Static frontend assets
├── nginx/                 # nginx config
├── Dockerfile
├── docker-compose.yml
└── deploy/README.md       # Detailed deployment guide
```
