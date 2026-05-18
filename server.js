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

// Routes
app.use('/api/weeks', require('./routes/weeks'));
app.use('/api/days', require('./routes/days'));
app.use('/api/users', require('./routes/users'));
app.use('/api/assignments', require('./routes/assignments'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Kindergarten planner running on port ${PORT}`);
});
