FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
# Runtime source is copied EXPLICITLY BY NAME to keep the image minimal on the RPi
# (we deliberately do NOT copy src/, dist/, snapshots/, hooks/, deploy/, vite config,
# or the Flutter SDK sources). server.js requires ./events, ./db and everything in
# ./routes; routes/* and days/assignments/settings also require ../events and ../db.
# WARNING: any NEW top-level runtime module that server.js (or its requires) loads
# MUST be added to this COPY line, or the container will crash-loop with
# "Cannot find module" at startup. Keep this list in sync with the require() graph.
COPY server.js db.js events.js ./
COPY routes ./routes
# Pre-built Flutter web bundle (only present on the `release` branch). Never built here.
COPY flutter/build/web ./flutter/build/web
EXPOSE 3000
CMD ["node", "server.js"]
