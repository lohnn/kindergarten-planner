#!/usr/bin/env node
/**
 * Contrast inspection snapshot: amber today-column tint vs. text legibility.
 *
 * Scenario designed to expose both reported issues:
 *   1. "Office" label text for second parent (Ben) in today's column
 *   2. Pick-up / drop-off time text in today's column
 *
 * Today = Monday (index 0).
 * No live server required — data is hardcoded.
 *
 * Usage: node snapshots/render-contrast-check.mjs
 * Output: snapshots/output/contrast-check-light.png
 *         snapshots/output/contrast-check-dark.png
 */
import React from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const h = React.createElement;

// ─── Theme (mirrors src/theme.js exactly) ────────────────────────────────────
const themes = {
  light: {
    bg: '#f9fafb',
    surface: '#ffffff',
    border: '#e5e7eb',
    text: '#111827',
    textMuted: '#6b7280',
    colorA: '#3b82f6',
    colorALight: '#dbeafe',
    colorAText: '#1d4ed8',
    colorB: '#c026d3',
    colorBLight: '#fae8ff',
    colorBText: '#a21caf',
    locHome: '#15803d',
    locHomeBg: '#dcfce7',
    locOffice: '#b91c1c',
    locOfficeBg: '#fee2e2',
    locOfficeTodayText: '#991b1b',
    locUnknown: '#9ca3af',
    conflict: '#ef4444',
    conflictBg: '#fee2e2',
    todayRing: '#d97706',
    todayHeaderBg: '#fffbeb',
    todayHeaderText: '#92400e',
    todayColBg: 'rgba(217, 119, 6, 0.25)',
  },
  dark: {
    bg: '#1f2937',
    surface: '#374151',
    border: '#4b5563',
    text: '#f9fafb',
    textMuted: '#9ca3af',
    colorA: '#60a5fa',
    colorALight: '#1e3a5f',
    colorAText: '#93c5fd',
    colorB: '#e879f9',
    colorBLight: '#4a044e',
    colorBText: '#f0abfc',
    locHome: '#4ade80',
    locHomeBg: '#064e3b',
    locOffice: '#d4a0a0',
    locOfficeBg: '#3b1515',
    locOfficeTodayText: '#fca5a5',
    locUnknown: '#6b7280',
    conflict: '#f87171',
    conflictBg: '#450a0a',
    todayRing: '#f59e0b',
    todayHeaderBg: '#2d2410',
    todayHeaderText: '#fcd34d',
    todayColBg: 'rgba(251, 191, 36, 0.25)',
  },
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DATES = ['19', '20', '21', '22', '23'];
const TODAY_INDEX = 0; // Monday is "today"

// Representative scenario:
//   Anna: Office Mon (today!), Home Tue, Home Wed, Office Thu, WFH Fri
//   Ben:  Office Mon (today!), Office Tue, Home Wed, Home Thu, Office Fri
// Drop-off on Mon: Ben assigned, time 8:15
// Pick-up  on Mon: Anna assigned, time 15:30
// Other days filled in to give context
const locA = ['office', 'home', 'home', 'office', 'home'];
const locB = ['office', 'office', 'home', 'home', 'office'];
const dropoffs = [
  { user: 'b', time: '8:15' },
  { user: 'a', time: '8:00' },
  { user: 'a', time: '8:00' },
  null,
  { user: 'b', time: '8:00' },
];
const pickups = [
  { user: 'a', time: '15:30' },
  { user: 'b', time: '15:00' },
  { user: 'b', time: '15:00' },
  { user: 'a', time: '15:00' },
  null,
];

function loadFont() {
  const candidates = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
    path.join(__dirname, 'Inter-Regular.ttf'),
  ];
  for (const fp of candidates) {
    if (fs.existsSync(fp)) return fs.readFileSync(fp);
  }
  throw new Error('No font found. Place Inter-Regular.ttf in snapshots/');
}

// ─── Component builders ───────────────────────────────────────────────────────

function DayHeader(t, i) {
  const isToday = i === TODAY_INDEX;
  return h('div', {
    key: String(i),
    style: {
      display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center',
      padding: '6px 2px',
      borderBottom: isToday ? `2px solid ${t.todayRing}` : `1px solid ${t.border}`,
      background: isToday ? t.todayHeaderBg : 'transparent',
      borderRadius: isToday ? '4px 4px 0 0' : 0,
    },
  },
    h('span', { style: { fontSize: 10, fontWeight: isToday ? 800 : 700, color: isToday ? t.todayHeaderText : t.textMuted } }, DAYS[i]),
    h('span', { style: { fontSize: 9, color: isToday ? t.todayHeaderText : t.textMuted, fontWeight: isToday ? 700 : 400 } }, DATES[i]),
  );
}

function LocationCell(t, locString, isToday, accentColor) {
  const isOffice = locString === 'office';
  const isHome = locString === 'home';
  const label = isOffice ? 'Office' : isHome ? 'WFH' : 'Unknown';
  const icon = isOffice ? '🏢' : isHome ? '🏠' : null;
  const baseBg = t.surface;
  const borderLeft = `4px solid ${accentColor}`;
  // Use stronger text color for Office label when inside today's amber tinted column
  const labelColor = (isOffice && isToday) ? t.locOfficeTodayText : accentColor;

  return h('div', {
    style: {
      display: 'flex', flex: 1, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', padding: '12px 2px', position: 'relative',
      background: baseBg,
      border: `1px solid ${t.border}`,
      borderLeft,
      margin: 1, borderRadius: 4, overflow: 'hidden',
    },
  },
    // Today amber overlay — this is the culprit
    isToday && h('div', {
      style: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: t.todayColBg, pointerEvents: 'none',
      },
    }),
    h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' } },
      icon && h('span', { style: { fontSize: 16 } }, icon),
      // ← Label now uses stronger color when isToday to compensate for amber tint
      h('span', { style: { fontSize: 8, fontWeight: 600, color: labelColor, marginTop: 2 } }, label),
    ),
  );
}

function AssignmentCell(t, assignment, isToday) {
  const pillColor = assignment?.user === 'a' ? t.colorA : t.colorB;
  const initials = assignment?.user === 'a' ? 'AN' : 'BE';

  if (!assignment) {
    return h('div', {
      style: {
        display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '12px 2px', position: 'relative',
        overflow: 'hidden', background: t.bg, border: `2px dashed ${t.border}`,
        margin: 1, borderRadius: 4, opacity: 0.5,
      },
    },
      isToday && h('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: t.todayColBg, pointerEvents: 'none' } }),
      h('span', { style: { fontSize: 9, color: t.textMuted, position: 'relative' } }, 'Unset'),
    );
  }

  return h('div', {
    style: {
      display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '10px 2px', position: 'relative',
      overflow: 'hidden', background: t.surface, border: `1px solid ${t.border}`,
      margin: 1, borderRadius: 4,
    },
  },
    // Amber overlay over the whole cell
    isToday && h('div', {
      style: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: t.todayColBg, pointerEvents: 'none',
      },
    }),
    h('div', {
      style: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: pillColor, borderRadius: 4, padding: '2px 6px', position: 'relative',
      },
    },
      h('span', { style: { fontSize: 9, fontWeight: 700, color: '#ffffff' } }, initials),
    ),
    // ← Time text now uses primary text color in today's column to compensate for amber tint
    assignment.time && h('span', {
      style: { fontSize: 8, color: isToday ? t.text : t.textMuted, marginTop: 2, position: 'relative' },
    }, assignment.time),
  );
}

function buildGrid(t, themeName) {
  const labelStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
    width: 64, minWidth: 64, paddingRight: 6, fontSize: 10, fontWeight: 600,
  };

  return h('div', {
    style: {
      display: 'flex', flexDirection: 'column', background: t.bg,
      fontFamily: 'sans-serif', padding: 12, width: 390,
    },
  },
    // Title
    h('div', { style: { display: 'flex', marginBottom: 4 } },
      h('span', { style: { fontSize: 13, fontWeight: 700, color: t.text } },
        `Contrast check — ${themeName} — today=Mon`),
    ),
    h('div', { style: { display: 'flex', marginBottom: 8 } },
      h('span', { style: { fontSize: 9, color: t.textMuted } },
        'Issues: Ben "Office" label in today col; time text in assign cells'),
    ),

    // Day headers
    h('div', { style: { display: 'flex' } },
      h('div', { style: { ...labelStyle } }),
      ...DAYS.map((_, i) => DayHeader(t, i)),
    ),

    // Anna row — Office on Mon (today)
    h('div', { style: { display: 'flex' } },
      h('div', { style: { ...labelStyle, color: t.colorAText } }, 'Anna'),
      ...locA.map((loc, i) => LocationCell(t, loc, i === TODAY_INDEX, t.locOffice)),
    ),

    // Ben row — Office on Mon (today): the primary reported contrast issue
    h('div', { style: { display: 'flex' } },
      h('div', { style: { ...labelStyle, color: t.colorBText } }, 'Ben'),
      ...locB.map((loc, i) => LocationCell(t, loc, i === TODAY_INDEX, t.locOffice)),
    ),

    // Drop-off row
    h('div', { style: { display: 'flex', marginTop: 4 } },
      h('div', { style: { ...labelStyle, color: t.textMuted } }, 'Drop-off'),
      ...dropoffs.map((a, i) => AssignmentCell(t, a, i === TODAY_INDEX)),
    ),

    // Pick-up row
    h('div', { style: { display: 'flex' } },
      h('div', { style: { ...labelStyle, color: t.textMuted } }, 'Pick-up'),
      ...pickups.map((a, i) => AssignmentCell(t, a, i === TODAY_INDEX)),
    ),
  );
}

async function main() {
  const fontData = loadFont();
  const fonts = [
    { name: 'sans-serif', data: fontData, weight: 400, style: 'normal' },
    { name: 'sans-serif', data: fontData, weight: 700, style: 'normal' },
  ];

  const outDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const [themeName, t] of Object.entries(themes)) {
    const element = buildGrid(t, themeName);
    const svg = await satori(element, { width: 390, height: 380, fonts });
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 390 } });
    const pngBuffer = resvg.render().asPng();
    const outPath = path.join(outDir, `contrast-check-${themeName}.png`);
    fs.writeFileSync(outPath, pngBuffer);
    console.log(`Saved: ${outPath} (${pngBuffer.length} bytes)`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
