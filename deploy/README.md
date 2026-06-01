# Kindergarten Planner — Raspberry Pi Deployment

Docker Compose deployment for Raspberry Pi 4 (ARM64).
Uses [Traefik](https://traefik.io) as the reverse proxy — routing driven by Docker labels, no config files needed.
Accessible over Tailscale (or local network).

## Prerequisites

Install Docker on Raspberry Pi OS:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose is bundled with Docker (as `docker compose`)
docker compose version
```

## First-Time Setup

```bash
git clone git@github.com:lohnn/kindergarten-planner.git
cd kindergarten-planner
docker compose up -d --build
```

The app will be available at `http://<pi-ip>/`.

## Updating the App

```bash
git pull
docker compose up -d --build --remove-orphans
```

> **Always use `--remove-orphans`** when updating. Without it, containers from old service configurations persist with their Traefik labels and intercept routes, causing phantom 404s.

## Architecture

A single `app` container runs Express, which serves both the REST API (`/api/*`) and the Flutter web frontend as static files. Traefik routes all traffic on port 80 to this container.

```
Browser → Traefik :80 → app :3000 (Express)
                                ├── /api/* → route handlers → SQLite
                                └── /*     → flutter/build/web/ static files
```

## Data Persistence

SQLite database lives in `./data/` on the Pi filesystem, mounted as a Docker volume. Preserved across container rebuilds and restarts.

```
data/
└── schedule.db
```

## Useful Commands

```bash
# View live logs
docker compose logs -f app

# Check running containers (verify no orphans)
docker compose ps -a

# Restart the app
docker compose restart app

# Stop everything
docker compose down

# Stop and remove volumes (WARNING: deletes database)
docker compose down -v

# Force full rebuild without cache
docker compose build --no-cache
docker compose up -d

# Enable Traefik dashboard (optional, for debugging)
# Add --api.insecure=true to the traefik command in docker-compose.yml
# then open http://<pi-ip>:8080
```

## Troubleshooting

### 404 on API routes that work inside the container

```bash
docker compose ps -a
```

If you see containers named `...-api-1` or `...-web-1` alongside `...-app-1`, those are orphans from a previous two-container setup. They have higher-priority Traefik labels and intercept `/api` traffic.

Fix:
```bash
docker compose down --remove-orphans
docker compose up -d --build
```

### Database issues

The DB file is at `./data/schedule.db`. The schema is created automatically on first start, including migrations. If the DB is corrupt or you want a clean slate:

```bash
docker compose down
rm data/schedule.db
docker compose up -d
```

This resets all data. Users will be re-seeded as "Person A" and "Person B" — rename them in Settings.
