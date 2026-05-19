#!/usr/bin/env node
/**
 * Runs the snapshot pipeline: starts the server, renders all variants, stops.
 */
const { spawn, execSync } = require('child_process');
const path = require('path');

const PORT = 3099;
const ROOT = path.join(__dirname, '..');

// Start server
const server = spawn('node', ['server.js'], {
  cwd: ROOT,
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'inherit'],
});

// Wait for server to be ready
function waitForServer(attempts = 30) {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const check = () => {
      tries++;
      const http = require('http');
      http.get(`http://localhost:${PORT}/api/users`, res => {
        resolve();
      }).on('error', () => {
        if (tries >= attempts) return reject(new Error('Server did not start'));
        setTimeout(check, 200);
      });
    };
    check();
  });
}

async function main() {
  try {
    await waitForServer();
    console.log('Server ready, rendering snapshots...');

    const variants = [
      { width: 390, theme: 'light' },
      { width: 768, theme: 'light' },
      { width: 1024, theme: 'dark' },
    ];

    for (const v of variants) {
      execSync(
        `node --experimental-vm-modules "${path.join(__dirname, 'render.mjs')}" --width=${v.width} --theme=${v.theme} --port=${PORT}`,
        { stdio: 'inherit', cwd: ROOT }
      );
    }

    console.log('All snapshots rendered successfully!');
  } finally {
    server.kill();
  }
}

main().catch(err => {
  console.error(err.message);
  server.kill();
  process.exit(1);
});
