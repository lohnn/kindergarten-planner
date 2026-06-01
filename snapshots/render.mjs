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

const h = React.createElement;

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

/**
 * Determine which day index (0-4) is "today" within the rendered week.
 * Returns -1 if today is not in the week.
 */
function getTodayIndex(days) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  for (let i = 0; i < days.length; i++) {
    if (days[i].date === todayStr) return i;
  }
  return -1;
}

// ─── Component builders (matching WeekGrid / contrast-check patterns) ─────────

function DayHeader(t, dayLabel, dateNum, isToday) {
  return h('div', {
    style: {
      display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center',
      padding: '6px 2px',
      borderBottom: isToday ? `2px solid ${t.todayRing}` : `1px solid ${t.border}`,
      background: isToday ? t.todayHeaderBg : 'transparent',
      borderRadius: isToday ? '4px 4px 0 0' : 0,
    },
  },
    h('span', { style: { fontSize: 10, fontWeight: isToday ? 800 : 700, color: isToday ? t.todayHeaderText : t.textMuted } }, dayLabel),
    h('span', { style: { fontSize: 9, color: isToday ? t.todayHeaderText : t.textMuted, fontWeight: isToday ? 700 : 400 } }, dateNum),
  );
}

function LocationCell(t, loc, isToday) {
  const location = loc?.work_location || 'unknown';
  const isOffice = location === 'office';
  const isHome = location === 'home';
  const isUnknown = !isOffice && !isHome;

  const accentColor = isOffice ? t.locOffice : isHome ? t.locHome : t.locUnknown;
  const label = isOffice ? 'Office' : isHome ? 'WFH' : '?';
  const icon = isOffice ? '🏢' : isHome ? '🏠' : null;
  const labelColor = (isOffice && isToday) ? t.locOfficeTodayText : accentColor;

  if (isUnknown) {
    return h('div', {
      style: {
        display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '12px 2px', position: 'relative',
        background: t.surface, border: `2px dashed ${t.locUnknown}`,
        borderLeft: `4px dashed ${t.locUnknown}`,
        margin: 1, borderRadius: 4, overflow: 'hidden', opacity: 0.7,
      },
    },
      isToday && h('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: t.todayColBg } }),
      h('span', { style: { fontSize: 14, position: 'relative' } }, '?'),
    );
  }

  return h('div', {
    style: {
      display: 'flex', flex: 1, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', padding: '12px 2px', position: 'relative',
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderLeft: `4px solid ${accentColor}`,
      margin: 1, borderRadius: 4, overflow: 'hidden',
    },
  },
    isToday && h('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: t.todayColBg } }),
    h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' } },
      icon && h('span', { style: { fontSize: 16 } }, icon),
      h('span', { style: { fontSize: 8, fontWeight: 600, color: labelColor, marginTop: 2 } }, label),
    ),
  );
}

function AssignmentCell(t, assignment, hasConflict, isToday, userA, userB, userMap) {
  if (hasConflict) {
    return h('div', {
      style: {
        display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '12px 2px', position: 'relative',
        overflow: 'hidden', background: t.conflictBg, border: `2px solid ${t.conflict}`,
        margin: 1, borderRadius: 4,
      },
    },
      isToday && h('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: t.todayColBg } }),
      h('span', { style: { fontSize: 14, color: t.conflict, position: 'relative' } }, '⚠️'),
    );
  }

  if (!assignment) {
    return h('div', {
      style: {
        display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '12px 2px', position: 'relative',
        overflow: 'hidden', background: t.surface, border: `2px dashed ${t.border}`,
        margin: 1, borderRadius: 4, opacity: 0.5,
      },
    },
      isToday && h('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: t.todayColBg } }),
      h('span', { style: { fontSize: 9, color: t.textMuted, position: 'relative' } }, 'Unset'),
    );
  }

  const user = userMap[assignment.user_id];
  const initials = (user?.name || '??').slice(0, 2).toUpperCase();
  const pillColor = user?.id === userA?.id ? t.colorA : user?.id === userB?.id ? t.colorB : t.colorOcc;

  return h('div', {
    style: {
      display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '10px 2px', position: 'relative',
      overflow: 'hidden', background: t.surface, border: `1px solid ${t.border}`,
      margin: 1, borderRadius: 4,
    },
  },
    isToday && h('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: t.todayColBg } }),
    h('div', {
      style: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: pillColor, borderRadius: 4, padding: '2px 6px', position: 'relative',
      },
    },
      h('span', { style: { fontSize: 9, fontWeight: 700, color: '#ffffff' } }, initials),
    ),
    assignment.time && h('span', {
      style: { fontSize: 8, color: isToday ? t.text : t.textMuted, marginTop: 2, position: 'relative' },
    }, assignment.time),
  );
}

function buildElement(weekData, theme) {
  const t = themes[theme];
  const days = weekData.days || [];
  const users = weekData.users || [];
  const primaries = users.filter(u => u.type === 'primary' || !u.type);
  const [userA, userB] = primaries;
  const userMap = {};
  for (const u of users) userMap[u.id] = u;

  const todayIndex = getTodayIndex(days);

  const labelStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
    width: 64, minWidth: 64, paddingRight: 6, fontSize: 10, fontWeight: 600,
  };

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
        ...days.map((day, i) => DayHeader(t, WEEKDAY_SHORT[i], day.date?.slice(8, 10), i === todayIndex))
      ),
      // User A locations
      h('div', { style: { display: 'flex' } },
        h('div', { style: { ...labelStyle, color: t.colorAText } }, userA?.name || 'A'),
        ...days.map((day, i) => LocationCell(t, (day.work_locations || []).find(w => userA && w.user_id === userA.id), i === todayIndex))
      ),
      // User B locations
      h('div', { style: { display: 'flex' } },
        h('div', { style: { ...labelStyle, color: t.colorBText } }, userB?.name || 'B'),
        ...days.map((day, i) => LocationCell(t, (day.work_locations || []).find(w => userB && w.user_id === userB.id), i === todayIndex))
      ),
      // Drop-off
      h('div', { style: { display: 'flex', marginTop: 4 } },
        h('div', { style: { ...labelStyle, color: t.textMuted } }, 'Drop-off'),
        ...days.map((day, i) => AssignmentCell(t, day.dropoff, (day.conflicts || []).some(c => c.includes('dropoff')), i === todayIndex, userA, userB, userMap))
      ),
      // Pick-up
      h('div', { style: { display: 'flex' } },
        h('div', { style: { ...labelStyle, color: t.textMuted } }, 'Pick-up'),
        ...days.map((day, i) => AssignmentCell(t, day.pickup, (day.conflicts || []).some(c => c.includes('pickup')), i === todayIndex, userA, userB, userMap))
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

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
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
