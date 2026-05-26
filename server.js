const express = require('express');
const path = require('path');

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
