const express = require('express');
const path = require('path');
const events = require('./events');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS — open for local network use
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SSE realtime stream — see events.js for the event contract.
// Registered before the static/SPA-fallback handlers so it is never swallowed.
app.get('/api/events', (req, res) => {
  // SSE headers. The CORS Allow-Origin header set above is preserved.
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable proxy buffering if present
  res.flushHeaders?.();

  // Initial comment so the client knows the stream is open.
  res.write(': connected\n\n');

  events.addClient(res);

  // Periodic keep-alive comment to survive idle-connection timeouts in proxies.
  const keepAlive = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch (err) {
      clearInterval(keepAlive);
    }
  }, events.KEEPALIVE_MS);

  req.on('close', () => {
    clearInterval(keepAlive);
    events.removeClient(res);
  });
});

// Routes
app.use('/api/weeks', require('./routes/weeks'));
app.use('/api/days', require('./routes/days'));
app.use('/api/users', require('./routes/users'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/settings', require('./routes/settings'));

// Static files — serve Flutter web build, fall back to dist/ or public/
const fs = require('fs');
const flutterDir = path.join(__dirname, 'flutter', 'build', 'web');
const distDir = path.join(__dirname, 'dist');
const staticDir = fs.existsSync(flutterDir) ? flutterDir
  : fs.existsSync(distDir) ? distDir
  : path.join(__dirname, 'public');
app.use(express.static(staticDir));
// SPA fallback — serve index.html for non-API routes
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Kindergarten planner running on port ${PORT}`);
});
