#!/usr/bin/env node
/**
 * Renders 4 design direction mockups as PNGs using Satori + resvg.
 */
import React from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIDTH = 390;

const h = React.createElement;

// Hardcoded sample data
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DATES = ['19', '20', '21', '22', '23'];
const userA = { name: 'Anna', id: 'a' };
const userB = { name: 'Ben', id: 'b' };

// Locations: h=home, o=office, ?=unknown
const locA = ['h', 'o', 'h', '?', 'o'];
const locB = ['o', 'h', '?', 'h', 'h'];

// Assignments: {user, time} or null
const dropoffs = [
  { user: 'a', time: '8:00' },
  { user: 'b', time: '8:15' },
  { user: 'a', time: '8:00' },
  null,
  { user: 'b', time: '8:00' },
];
const pickups = [
  { user: 'b', time: '15:00' },
  { user: 'a', time: '15:30' },
  { user: 'b', time: '15:00' },
  { user: 'a', time: '15:00' },
  null,
];

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
  throw new Error('No font found');
}

// Direction 1: Semantic Locations, Neutral Rows
function buildDirection1() {
  const labelStyle = { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 64, minWidth: 64, paddingRight: 6, fontSize: 10, fontWeight: 600 };

  function locCell(loc) {
    let bg, color, border, label;
    if (loc === 'h') { bg = '#d1fae5'; color = '#065f46'; border = '1px solid #a7f3d0'; label = 'Home'; }
    else if (loc === 'o') { bg = '#f1f5f9'; color = '#475569'; border = '1px solid #e2e8f0'; label = 'Office'; }
    else { bg = '#fef3c7'; color = '#92400e'; border = '1px dashed #fbbf24'; label = '?'; }
    return h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', background: bg, border, borderRadius: 4, margin: 1, padding: '10px 2px', color, fontSize: 9, fontWeight: 600 } }, label);
  }

  function assignCell(a) {
    if (!a) return h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 4, margin: 1, padding: '8px 2px', fontSize: 11 } }, '⚠');
    const pillColor = a.user === 'a' ? '#3b82f6' : '#f97316';
    const name = a.user === 'a' ? 'A' : 'B';
    return h('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 4, margin: 1, padding: '6px 2px' } },
      h('div', { style: { display: 'flex', background: pillColor, borderRadius: 4, padding: '2px 8px' } },
        h('span', { style: { fontSize: 9, fontWeight: 700, color: '#fff' } }, name)),
      h('span', { style: { fontSize: 8, color: '#64748b', marginTop: 2 } }, a.time));
  }

  return h('div', { style: { display: 'flex', flexDirection: 'column', background: '#ffffff', fontFamily: 'sans-serif', padding: 12, width: WIDTH } },
    h('div', { style: { display: 'flex', marginBottom: 8 } },
      h('span', { style: { fontSize: 14, fontWeight: 700, color: '#1e293b' } }, 'Direction 1: Semantic Locations')),
    h('div', { style: { display: 'flex', marginBottom: 4 } },
      h('span', { style: { fontSize: 10, color: '#64748b' } }, 'Week of May 19-23, 2026')),
    // Day headers
    h('div', { style: { display: 'flex' } },
      h('div', { style: labelStyle }),
      ...DAYS.map((d, i) => h('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', padding: '4px 2px' } },
        h('span', { style: { fontSize: 10, fontWeight: 700, color: '#64748b' } }, d),
        h('span', { style: { fontSize: 8, color: '#94a3b8' } }, DATES[i])))),
    // User A
    h('div', { style: { display: 'flex', marginTop: 4 } },
      h('div', { style: { ...labelStyle, color: '#1e293b' } }, 'Anna'),
      ...locA.map(l => locCell(l))),
    // User B
    h('div', { style: { display: 'flex', marginTop: 2 } },
      h('div', { style: { ...labelStyle, color: '#1e293b' } }, 'Ben'),
      ...locB.map(l => locCell(l))),
    // Drop-off
    h('div', { style: { display: 'flex', marginTop: 8 } },
      h('div', { style: { ...labelStyle, color: '#64748b' } }, 'Drop-off'),
      ...dropoffs.map(a => assignCell(a))),
    // Pick-up
    h('div', { style: { display: 'flex', marginTop: 2 } },
      h('div', { style: { ...labelStyle, color: '#64748b' } }, 'Pick-up'),
      ...pickups.map(a => assignCell(a))),
  );
}

// Direction 2: Border + Fill
function buildDirection2() {
  const labelStyle = { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 64, minWidth: 64, paddingRight: 6, fontSize: 10, fontWeight: 600 };

  function locCell(loc) {
    let bg, label;
    if (loc === 'h') { bg = '#fef9ef'; label = 'Home'; }
    else if (loc === 'o') { bg = '#f0f4f8'; label = 'Office'; }
    else { bg = '#f9fafb'; label = '?'; }
    const border = loc === '?' ? '1px dashed #d1d5db' : '1px solid #e5e7eb';
    return h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', background: bg, border, borderRadius: 4, margin: 1, padding: '10px 2px', fontSize: 9, fontWeight: 600, color: '#374151' } }, label);
  }

  function assignCell(a) {
    if (!a) return h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 4, margin: 1, padding: '8px 2px', fontSize: 11 } }, '⚠');
    const pillColor = a.user === 'a' ? '#3b82f6' : '#f97316';
    const name = a.user === 'a' ? 'A' : 'B';
    return h('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 4, margin: 1, padding: '6px 2px' } },
      h('div', { style: { display: 'flex', background: pillColor, borderRadius: 4, padding: '2px 8px' } },
        h('span', { style: { fontSize: 9, fontWeight: 700, color: '#fff' } }, name)),
      h('span', { style: { fontSize: 8, color: '#64748b', marginTop: 2 } }, a.time));
  }

  function userRow(name, locs, borderColor) {
    return h('div', { style: { display: 'flex', marginTop: 2, borderLeft: `4px solid ${borderColor}`, borderRadius: 4, paddingLeft: 2 } },
      h('div', { style: { ...labelStyle, color: '#1e293b', width: 58, minWidth: 58 } }, name),
      ...locs.map(l => locCell(l)));
  }

  return h('div', { style: { display: 'flex', flexDirection: 'column', background: '#ffffff', fontFamily: 'sans-serif', padding: 12, width: WIDTH } },
    h('div', { style: { display: 'flex', marginBottom: 8 } },
      h('span', { style: { fontSize: 14, fontWeight: 700, color: '#1e293b' } }, 'Direction 2: Border + Fill')),
    h('div', { style: { display: 'flex', marginBottom: 4 } },
      h('span', { style: { fontSize: 10, color: '#64748b' } }, 'Week of May 19-23, 2026')),
    h('div', { style: { display: 'flex' } },
      h('div', { style: { ...labelStyle } }),
      ...DAYS.map((d, i) => h('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', padding: '4px 2px' } },
        h('span', { style: { fontSize: 10, fontWeight: 700, color: '#64748b' } }, d),
        h('span', { style: { fontSize: 8, color: '#94a3b8' } }, DATES[i])))),
    userRow('Anna', locA, '#3b82f6'),
    userRow('Ben', locB, '#f97316'),
    h('div', { style: { display: 'flex', marginTop: 8 } },
      h('div', { style: { ...labelStyle, color: '#64748b' } }, 'Drop-off'),
      ...dropoffs.map(a => assignCell(a))),
    h('div', { style: { display: 'flex', marginTop: 2 } },
      h('div', { style: { ...labelStyle, color: '#64748b' } }, 'Pick-up'),
      ...pickups.map(a => assignCell(a))),
  );
}

// Direction 3: High-Contrast Cards
function buildDirection3() {
  const labelStyle = { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 64, minWidth: 64, paddingRight: 6, fontSize: 10, fontWeight: 600 };

  function locCell(loc) {
    if (loc === '?') {
      return h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', border: '1px dashed #d1d5db', borderRadius: 6, margin: 1, padding: '10px 2px', opacity: 0.6, fontSize: 12, color: '#9ca3af' } }, '?');
    }
    const accentColor = loc === 'h' ? '#15803d' : '#4338ca';
    const label = loc === 'h' ? 'Home' : 'Office';
    return h('div', { style: { display: 'flex', flex: 1, flexDirection: 'row', alignItems: 'center', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 6, margin: 1, overflow: 'hidden' } },
      h('div', { style: { display: 'flex', width: 4, minWidth: 4, height: '100%', minHeight: 32, background: accentColor } }),
      h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '8px 4px' } },
        h('span', { style: { fontSize: 9, fontWeight: 700, color: accentColor } }, label)));
  }

  function assignCell(a) {
    if (!a) return h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, margin: 1, padding: '8px 2px', fontSize: 12 } }, '⚠');
    const pillColor = a.user === 'a' ? '#3b82f6' : '#f97316';
    const name = a.user === 'a' ? 'Anna' : 'Ben';
    return h('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 6, margin: 1, padding: '6px 2px' } },
      h('div', { style: { display: 'flex', background: pillColor, borderRadius: 6, padding: '3px 10px' } },
        h('span', { style: { fontSize: 10, fontWeight: 700, color: '#fff' } }, name)),
      h('span', { style: { fontSize: 8, color: '#6b7280', marginTop: 2 } }, a.time));
  }

  return h('div', { style: { display: 'flex', flexDirection: 'column', background: '#f9fafb', fontFamily: 'sans-serif', padding: 12, width: WIDTH } },
    h('div', { style: { display: 'flex', marginBottom: 8 } },
      h('span', { style: { fontSize: 14, fontWeight: 700, color: '#111827' } }, 'Direction 3: High-Contrast Cards')),
    h('div', { style: { display: 'flex', marginBottom: 4 } },
      h('span', { style: { fontSize: 10, color: '#6b7280' } }, 'Week of May 19-23, 2026')),
    h('div', { style: { display: 'flex' } },
      h('div', { style: labelStyle }),
      ...DAYS.map((d, i) => h('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', padding: '4px 2px' } },
        h('span', { style: { fontSize: 10, fontWeight: 700, color: '#6b7280' } }, d),
        h('span', { style: { fontSize: 8, color: '#9ca3af' } }, DATES[i])))),
    h('div', { style: { display: 'flex', marginTop: 4 } },
      h('div', { style: { ...labelStyle, color: '#374151' } }, 'Anna'),
      ...locA.map(l => locCell(l))),
    h('div', { style: { display: 'flex', marginTop: 2 } },
      h('div', { style: { ...labelStyle, color: '#374151' } }, 'Ben'),
      ...locB.map(l => locCell(l))),
    h('div', { style: { display: 'flex', marginTop: 8 } },
      h('div', { style: { ...labelStyle, color: '#6b7280' } }, 'Drop-off'),
      ...dropoffs.map(a => assignCell(a))),
    h('div', { style: { display: 'flex', marginTop: 2 } },
      h('div', { style: { ...labelStyle, color: '#6b7280' } }, 'Pick-up'),
      ...pickups.map(a => assignCell(a))),
  );
}

// Direction 3 Revised: High-Contrast Cards with updated colors
function buildDirection3Revised() {
  const labelStyle = { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 64, minWidth: 64, paddingRight: 6, fontSize: 10, fontWeight: 600 };

  function locCell(loc) {
    if (loc === '?') {
      return h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', border: '1px dashed #d1d5db', borderRadius: 6, margin: 1, padding: '10px 2px', opacity: 0.6, fontSize: 12, color: '#9ca3af' } }, '?');
    }
    const accentColor = loc === 'h' ? '#15803d' : '#b91c1c';
    const label = loc === 'h' ? 'Home' : 'Office';
    return h('div', { style: { display: 'flex', flex: 1, flexDirection: 'row', alignItems: 'center', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 6, margin: 1, overflow: 'hidden' } },
      h('div', { style: { display: 'flex', width: 4, minWidth: 4, height: '100%', minHeight: 32, background: accentColor } }),
      h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '8px 4px' } },
        h('span', { style: { fontSize: 9, fontWeight: 700, color: accentColor } }, label)));
  }

  function assignCell(a) {
    if (!a) return h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, margin: 1, padding: '8px 2px', fontSize: 12 } }, '⚠');
    const pillColor = a.user === 'a' ? '#3b82f6' : '#7c3aed';
    const name = a.user === 'a' ? 'Anna' : 'Ben';
    return h('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 6, margin: 1, padding: '6px 2px' } },
      h('div', { style: { display: 'flex', background: pillColor, borderRadius: 6, padding: '3px 10px' } },
        h('span', { style: { fontSize: 10, fontWeight: 700, color: '#fff' } }, name)),
      h('span', { style: { fontSize: 8, color: '#6b7280', marginTop: 2 } }, a.time));
  }

  return h('div', { style: { display: 'flex', flexDirection: 'column', background: '#f9fafb', fontFamily: 'sans-serif', padding: 12, width: WIDTH } },
    h('div', { style: { display: 'flex', marginBottom: 8 } },
      h('span', { style: { fontSize: 14, fontWeight: 700, color: '#111827' } }, 'Direction 3 Revised: High-Contrast Cards')),
    h('div', { style: { display: 'flex', marginBottom: 4 } },
      h('span', { style: { fontSize: 10, color: '#6b7280' } }, 'Week of May 19-23, 2026')),
    h('div', { style: { display: 'flex' } },
      h('div', { style: labelStyle }),
      ...DAYS.map((d, i) => h('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', padding: '4px 2px' } },
        h('span', { style: { fontSize: 10, fontWeight: 700, color: '#6b7280' } }, d),
        h('span', { style: { fontSize: 8, color: '#9ca3af' } }, DATES[i])))),
    h('div', { style: { display: 'flex', marginTop: 4 } },
      h('div', { style: { ...labelStyle, color: '#374151' } }, 'Anna'),
      ...locA.map(l => locCell(l))),
    h('div', { style: { display: 'flex', marginTop: 2 } },
      h('div', { style: { ...labelStyle, color: '#374151' } }, 'Ben'),
      ...locB.map(l => locCell(l))),
    h('div', { style: { display: 'flex', marginTop: 8 } },
      h('div', { style: { ...labelStyle, color: '#6b7280' } }, 'Drop-off'),
      ...dropoffs.map(a => assignCell(a))),
    h('div', { style: { display: 'flex', marginTop: 2 } },
      h('div', { style: { ...labelStyle, color: '#6b7280' } }, 'Pick-up'),
      ...pickups.map(a => assignCell(a))),
  );
}

// Direction 3 Revised2: Ben pill color variants
function buildDirection3Revised2(benColor, subtitle) {
  const labelStyle = { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 64, minWidth: 64, paddingRight: 6, fontSize: 10, fontWeight: 600 };

  function locCell(loc) {
    if (loc === '?') {
      return h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', border: '1px dashed #d1d5db', borderRadius: 6, margin: 1, padding: '10px 2px', opacity: 0.6, fontSize: 12, color: '#9ca3af' } }, '?');
    }
    const accentColor = loc === 'h' ? '#15803d' : '#b91c1c';
    const label = loc === 'h' ? 'Home' : 'Office';
    return h('div', { style: { display: 'flex', flex: 1, flexDirection: 'row', alignItems: 'center', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 6, margin: 1, overflow: 'hidden' } },
      h('div', { style: { display: 'flex', width: 4, minWidth: 4, height: '100%', minHeight: 32, background: accentColor } }),
      h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '8px 4px' } },
        h('span', { style: { fontSize: 9, fontWeight: 700, color: accentColor } }, label)));
  }

  function assignCell(a) {
    if (!a) return h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, margin: 1, padding: '8px 2px', fontSize: 12 } }, '⚠');
    const pillColor = a.user === 'a' ? '#3b82f6' : benColor;
    const name = a.user === 'a' ? 'Anna' : 'Ben';
    return h('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 6, margin: 1, padding: '6px 2px' } },
      h('div', { style: { display: 'flex', background: pillColor, borderRadius: 6, padding: '3px 10px' } },
        h('span', { style: { fontSize: 10, fontWeight: 700, color: '#fff' } }, name)),
      h('span', { style: { fontSize: 8, color: '#6b7280', marginTop: 2 } }, a.time));
  }

  return h('div', { style: { display: 'flex', flexDirection: 'column', background: '#f9fafb', fontFamily: 'sans-serif', padding: 12, width: WIDTH } },
    h('div', { style: { display: 'flex', marginBottom: 4 } },
      h('span', { style: { fontSize: 13, fontWeight: 700, color: '#111827' } }, `Dir3 Rev2: ${subtitle}`)),
    h('div', { style: { display: 'flex', marginBottom: 4 } },
      h('span', { style: { fontSize: 10, color: '#6b7280' } }, `Ben pill: ${benColor}`)),
    h('div', { style: { display: 'flex' } },
      h('div', { style: labelStyle }),
      ...DAYS.map((d, i) => h('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', padding: '4px 2px' } },
        h('span', { style: { fontSize: 10, fontWeight: 700, color: '#6b7280' } }, d),
        h('span', { style: { fontSize: 8, color: '#9ca3af' } }, DATES[i])))),
    h('div', { style: { display: 'flex', marginTop: 4 } },
      h('div', { style: { ...labelStyle, color: '#374151' } }, 'Anna'),
      ...locA.map(l => locCell(l))),
    h('div', { style: { display: 'flex', marginTop: 2 } },
      h('div', { style: { ...labelStyle, color: '#374151' } }, 'Ben'),
      ...locB.map(l => locCell(l))),
    h('div', { style: { display: 'flex', marginTop: 8 } },
      h('div', { style: { ...labelStyle, color: '#6b7280' } }, 'Drop-off'),
      ...dropoffs.map(a => assignCell(a))),
    h('div', { style: { display: 'flex', marginTop: 2 } },
      h('div', { style: { ...labelStyle, color: '#6b7280' } }, 'Pick-up'),
      ...pickups.map(a => assignCell(a))),
  );
}

function buildDirection3Rev2a() { return buildDirection3Revised2('#9333ea', 'purple-600 warmer'); }
function buildDirection3Rev2b() { return buildDirection3Revised2('#a855f7', 'lighter warm purple'); }
function buildDirection3Rev2c() { return buildDirection3Revised2('#c026d3', 'fuchsia-600 magenta'); }

// Direction 4: Emoji-Minimal
function buildDirection4() {
  const labelStyle = { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 64, minWidth: 64, paddingRight: 6, fontSize: 10, fontWeight: 600 };

  function locCell(loc) {
    if (loc === '?') {
      return h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', background: '#ffffff', border: '1px dashed #d1d5db', borderRadius: 4, margin: 1, padding: '8px 2px', color: '#9ca3af', fontSize: 12 } }, '—');
    }
    const bg = loc === 'h' ? '#f5f5f4' : '#f8fafc';
    const icon = loc === 'h' ? '🏠' : '🏢';
    return h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', background: bg, border: '1px solid #e5e7eb', borderRadius: 4, margin: 1, padding: '8px 2px', fontSize: 14 } }, icon);
  }

  function assignCell(a) {
    if (!a) return h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, margin: 1, padding: '8px 2px', fontSize: 11 } }, '⚠');
    const isA = a.user === 'a';
    const bg = isA ? '#dbeafe' : '#ffedd5';
    const color = isA ? '#1d4ed8' : '#c2410c';
    const border = isA ? '2px solid #3b82f6' : '2px solid #f97316';
    const name = isA ? 'Anna' : 'Ben';
    return h('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bg, border, borderRadius: 6, margin: 1, padding: '5px 2px' } },
      h('span', { style: { fontSize: 10, fontWeight: 700, color } }, name),
      h('span', { style: { fontSize: 8, color: '#6b7280', marginTop: 1 } }, a.time));
  }

  return h('div', { style: { display: 'flex', flexDirection: 'column', background: '#ffffff', fontFamily: 'sans-serif', padding: 12, width: WIDTH } },
    h('div', { style: { display: 'flex', marginBottom: 8 } },
      h('span', { style: { fontSize: 14, fontWeight: 700, color: '#1e293b' } }, 'Direction 4: Emoji-Minimal')),
    h('div', { style: { display: 'flex', marginBottom: 4 } },
      h('span', { style: { fontSize: 10, color: '#64748b' } }, 'Week of May 19-23, 2026')),
    h('div', { style: { display: 'flex' } },
      h('div', { style: labelStyle }),
      ...DAYS.map((d, i) => h('div', { style: { display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', padding: '4px 2px' } },
        h('span', { style: { fontSize: 10, fontWeight: 700, color: '#64748b' } }, d),
        h('span', { style: { fontSize: 8, color: '#94a3b8' } }, DATES[i])))),
    h('div', { style: { display: 'flex', marginTop: 4 } },
      h('div', { style: { ...labelStyle, color: '#64748b' } }, 'Anna'),
      ...locA.map(l => locCell(l))),
    h('div', { style: { display: 'flex', marginTop: 2 } },
      h('div', { style: { ...labelStyle, color: '#64748b' } }, 'Ben'),
      ...locB.map(l => locCell(l))),
    h('div', { style: { display: 'flex', marginTop: 8 } },
      h('div', { style: { ...labelStyle, color: '#1d4ed8', fontWeight: 700 } }, 'Drop-off'),
      ...dropoffs.map(a => assignCell(a))),
    h('div', { style: { display: 'flex', marginTop: 2 } },
      h('div', { style: { ...labelStyle, color: '#c2410c', fontWeight: 700 } }, 'Pick-up'),
      ...pickups.map(a => assignCell(a))),
  );
}

async function main() {
  const fontData = loadFont();
  const fonts = [
    { name: 'sans-serif', data: fontData, weight: 400, style: 'normal' },
    { name: 'sans-serif', data: fontData, weight: 700, style: 'normal' },
  ];

  const directions = [
    { name: 'mockup-direction-1', build: buildDirection1 },
    { name: 'mockup-direction-2', build: buildDirection2 },
    { name: 'mockup-direction-3', build: buildDirection3 },
    { name: 'mockup-direction-3-revised', build: buildDirection3Revised },
    { name: 'mockup-direction-3-rev2a', build: buildDirection3Rev2a },
    { name: 'mockup-direction-3-rev2b', build: buildDirection3Rev2b },
    { name: 'mockup-direction-3-rev2c', build: buildDirection3Rev2c },
    { name: 'mockup-direction-4', build: buildDirection4 },
  ];

  for (const dir of directions) {
    const element = dir.build();
    const svg = await satori(element, { width: WIDTH, height: 320, fonts });
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
    const pngBuffer = resvg.render().asPng();
    const outPath = path.join(__dirname, `${dir.name}.png`);
    fs.writeFileSync(outPath, pngBuffer);
    console.log(`Saved: ${outPath} (${pngBuffer.length} bytes)`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
