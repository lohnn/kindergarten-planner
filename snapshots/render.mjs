#!/usr/bin/env node
/**
 * Snapshot renderer: React → Satori → SVG → @resvg/resvg-js → PNG
 * Usage: node snapshots/render.mjs [--width=390|768|1024] [--theme=light|dark] [--week=21] [--year=2026] [--port=3000]
 */
import React from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// We can't import JSX directly without transpilation, so we inline the component tree
// using the theme and data. We'll import theme data and rebuild the component.
import { themes } from '../src/theme.js';
import { WEEKDAY_SHORT } from '../src/weekHelpers.js';

// Parse args
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace('--', '').split('=');
    return [k, v];
  })
);

const WIDTH = parseInt(args.width || '390', 10);
const THEME = args.theme || 'light';
const YEAR = parseInt(args.year || '2026', 10);
const WEEK = parseInt(args.week || '21', 10);
const PORT = parseInt(args.port || '3000', 10);

function fetchJSON(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${urlPath}`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        resolve(JSON.parse(data));
      });
    }).on('error', reject);
  });
}

function loadFont() {
  const fontPaths = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
    path.join(__dirname, 'Inter-Regular.ttf'),
  ];
  for (const fp of fontPaths) {
    if (fs.existsSync(fp)) return fs.readFileSync(fp);
  }
  throw new Error('No font found. Place Inter-Regular.ttf in snapshots/');
}

// Satori-compatible component tree (pure React.createElement, no JSX needed at runtime)
function buildElement(weekData, theme) {
  const t = themes[theme];
  const days = weekData.days || [];
  const users = weekData.users || [];
  const primaries = users.filter(u => u.type === 'primary' || !u.type);
  const [userA, userB] = primaries;
  const userMap = {};
  for (const u of users) userMap[u.id] = u;

  const h = React.createElement;

  const labelStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
    width: 64, minWidth: 64, paddingRight: 6, fontSize: 10, fontWeight: 600,
  };

  function LocationCell(loc, bgColor) {
    const location = loc?.work_location || 'home';
    const icon = location === 'office' ? '🏢' : '🏠';
    const label = location === 'office' ? 'Office' : 'WFH';
    return h('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 2px', background: bgColor, border: `1px solid ${t.border}`, margin: 1, borderRadius: 4 } },
      h('span', { style: { fontSize: 16 } }, icon),
      h('span', { style: { fontSize: 8, fontWeight: 600, color: t.textMuted, marginTop: 2 } }, label)
    );
  }

  function AssignCell(assignment, hasConflict) {
    if (hasConflict || !assignment) {
      return h('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 2px', background: t.conflictBg, border: `1px solid ${t.conflict}`, margin: 1, borderRadius: 4 } },
        h('span', { style: { fontSize: 14, color: t.conflict } }, '⚠️')
      );
    }
    const user = userMap[assignment.user_id];
    const initials = (user?.name || '??').slice(0, 2).toUpperCase();
    const pillColor = user?.id === userA?.id ? t.colorA : user?.id === userB?.id ? t.colorB : t.colorOcc;
    return h('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 2px', background: t.surface, border: `1px solid ${t.border}`, margin: 1, borderRadius: 4 } },
      h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: pillColor, borderRadius: 4, padding: '2px 6px' } },
        h('span', { style: { fontSize: 9, fontWeight: 700, color: '#ffffff' } }, initials)
      ),
      assignment.time ? h('span', { style: { fontSize: 8, color: t.textMuted, marginTop: 2 } }, assignment.time) : null
    );
  }

  return h('div', { style: { display: 'flex', flexDirection: 'column', background: t.bg, fontFamily: 'sans-serif', padding: 12, width: WIDTH } },
    // Header
    h('div', { style: { display: 'flex', flexDirection: 'column', padding: '12px 12px 8px', background: t.surface, borderBottom: `1px solid ${t.border}`, borderRadius: 8, marginBottom: 8 } },
      h('span', { style: { fontSize: 16, fontWeight: 700, color: t.text } }, '🎒 Kinder Planner'),
      h('div', { style: { display: 'flex', alignItems: 'center', marginTop: 6 } },
        h('span', { style: { fontSize: 12, color: t.textMuted, marginRight: 8 } }, 'I am:'),
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 12px', borderRadius: 6, border: `2px solid ${t.colorA}`, background: t.colorALight, color: t.colorAText, fontSize: 12, fontWeight: 700 } }, userA?.name || 'A'),
        h('div', { style: { width: 6 } }),
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 12px', borderRadius: 6, border: `2px solid ${t.border}`, background: t.surface, color: t.textMuted, fontSize: 12, fontWeight: 600 } }, userB?.name || 'B'),
      )
    ),
    // Week nav
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' } },
      h('span', { style: { fontSize: 13, fontWeight: 600, color: t.text } }, `Week ${WEEK}, ${YEAR}`)
    ),
    // Grid
    h('div', { style: { display: 'flex', flexDirection: 'column' } },
      // Day headers
      h('div', { style: { display: 'flex' } },
        h('div', { style: { ...labelStyle, color: t.textMuted } }),
        ...days.map((day, i) => h('div', { key: String(i), style: { display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', padding: '6px 2px', borderBottom: `1px solid ${t.border}` } },
          h('span', { style: { fontSize: 10, fontWeight: 700, color: t.textMuted } }, WEEKDAY_SHORT[i]),
          h('span', { style: { fontSize: 9, color: t.textMuted } }, day.date?.slice(8, 10))
        ))
      ),
      // User A
      h('div', { style: { display: 'flex' } },
        h('div', { style: { ...labelStyle, color: t.colorAText } }, userA?.name || 'A'),
        ...days.map((day, i) => LocationCell((day.work_locations || []).find(w => userA && w.user_id === userA.id), t.colorALight))
      ),
      // User B
      h('div', { style: { display: 'flex' } },
        h('div', { style: { ...labelStyle, color: t.colorBText } }, userB?.name || 'B'),
        ...days.map((day, i) => LocationCell((day.work_locations || []).find(w => userB && w.user_id === userB.id), t.colorBLight))
      ),
      // Drop-off
      h('div', { style: { display: 'flex', marginTop: 4 } },
        h('div', { style: { ...labelStyle, color: t.textMuted } }, 'Drop-off'),
        ...days.map((day, i) => AssignCell(day.dropoff, (day.conflicts || []).some(c => c.includes('dropoff'))))
      ),
      // Pick-up
      h('div', { style: { display: 'flex' } },
        h('div', { style: { ...labelStyle, color: t.textMuted } }, 'Pick-up'),
        ...days.map((day, i) => AssignCell(day.pickup, (day.conflicts || []).some(c => c.includes('pickup'))))
      ),
    )
  );
}

async function main() {
  console.log(`Rendering week ${WEEK}/${YEAR}, width=${WIDTH}, theme=${THEME}`);

  const [weekData, users] = await Promise.all([
    fetchJSON(`/api/weeks/${YEAR}/${WEEK}`),
    fetchJSON('/api/users'),
  ]);
  weekData.users = users;

  const fontData = loadFont();

  const element = buildElement(weekData, THEME);

  const svg = await satori(element, {
    width: WIDTH,
    height: 400,
    fonts: [
      { name: 'sans-serif', data: fontData, weight: 400, style: 'normal' },
      { name: 'sans-serif', data: fontData, weight: 700, style: 'normal' },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
  });
  const pngBuffer = resvg.render().asPng();

  const outDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const pngPath = path.join(outDir, `${WIDTH}-${THEME}.png`);
  fs.writeFileSync(pngPath, pngBuffer);
  console.log(`Saved: ${pngPath} (${pngBuffer.length} bytes)`);
}

main().catch(err => {
  console.error('Render failed:', err.message);
  process.exit(1);
});
