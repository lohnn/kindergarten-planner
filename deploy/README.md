# Kindergarten Planner — Raspberry Pi Deployment

Docker Compose based deployment for Raspberry Pi 4 (ARM64).

## Prerequisites

Install Docker and Docker Compose on Raspberry Pi OS:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose is included with Docker (as `docker compose`)
# Verify
docker compose version
```

## First-Time Setup

```bash
git clone git@github.com:lohnn/kindergarten-planner-.git
cd kindergarten-planner-
docker compose up -d
```

The app will be available at `http://<pi-ip>/`.

## Updating the App

```bash
git pull
docker compose up -d --build
```

## Accessing the App

Open a browser and navigate to `http://<pi-ip>/` — replace `<pi-ip>` with the local IP address of your Raspberry Pi (e.g. `http://192.168.1.42/`).

## Data Persistence

SQLite database lives in `./data/` on the Pi filesystem, mounted as a volume. It is preserved across container rebuilds and restarts.

## Useful Commands

```bash
# View live logs
docker compose logs -f

# View logs for a specific service
docker compose logs -f app

# Restart services
docker compose restart

# Stop everything
docker compose down

# Stop and remove volumes (WARNING: deletes database)
docker compose down -v

# Check running containers
docker compose ps
```
