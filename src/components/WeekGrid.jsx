import React from 'react';
import { WEEKDAY_SHORT } from '../weekHelpers.js';

export default function WeekGrid({ theme, data, users }) {
  const days = data.days || [];
  const primaries = users.filter(u => u.type === 'primary' || !u.type);
  const [userA, userB] = primaries;
  const userMap = {};
  for (const u of users) userMap[u.id] = u;

  // Row labels
  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 64,
    minWidth: 64,
    paddingRight: 6,
    fontSize: 10,
    fontWeight: 600,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '0 12px 12px' }}>
      {/* Header row */}
      <div style={{ display: 'flex' }}>
        <div style={{ ...labelStyle, color: theme.textMuted }}></div>
        {days.map((day, i) => (
          <div key={i} style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', padding: '6px 2px', borderBottom: `1px solid ${theme.border}` }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted }}>{WEEKDAY_SHORT[i]}</span>
            <span style={{ fontSize: 9, color: theme.textMuted }}>{day.date?.slice(8, 10)}</span>
          </div>
        ))}
      </div>

      {/* User A row */}
      <div style={{ display: 'flex' }}>
        <div style={{ ...labelStyle, color: theme.colorAText }}>{userA?.name || 'A'}</div>
        {days.map((day, i) => {
          const loc = (day.work_locations || []).find(w => userA && w.user_id === userA.id);
          return <LocationCell key={i} theme={theme} loc={loc} bgColor={theme.colorALight} />;
        })}
      </div>

      {/* User B row */}
      <div style={{ display: 'flex' }}>
        <div style={{ ...labelStyle, color: theme.colorBText }}>{userB?.name || 'B'}</div>
        {days.map((day, i) => {
          const loc = (day.work_locations || []).find(w => userB && w.user_id === userB.id);
          return <LocationCell key={i} theme={theme} loc={loc} bgColor={theme.colorBLight} />;
        })}
      </div>

      {/* Drop-off row */}
      <div style={{ display: 'flex', marginTop: 4 }}>
        <div style={{ ...labelStyle, color: theme.textMuted }}>Drop-off</div>
        {days.map((day, i) => {
          const hasConflict = (day.conflicts || []).some(c => c.includes('dropoff'));
          return <AssignmentCell key={i} theme={theme} assignment={day.dropoff} hasConflict={hasConflict} userMap={userMap} userA={userA} userB={userB} />;
        })}
      </div>

      {/* Pick-up row */}
      <div style={{ display: 'flex' }}>
        <div style={{ ...labelStyle, color: theme.textMuted }}>Pick-up</div>
        {days.map((day, i) => {
          const hasConflict = (day.conflicts || []).some(c => c.includes('pickup'));
          return <AssignmentCell key={i} theme={theme} assignment={day.pickup} hasConflict={hasConflict} userMap={userMap} userA={userA} userB={userB} />;
        })}
      </div>
    </div>
  );
}

function LocationCell({ theme, loc, bgColor }) {
  const location = loc?.work_location || 'home';
  const icon = location === 'office' ? '🏢' : '🏠';
  const label = location === 'office' ? 'Office' : 'WFH';

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 2px', background: bgColor, border: `1px solid ${theme.border}`, margin: 1, borderRadius: 4 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 8, fontWeight: 600, color: theme.textMuted, marginTop: 2 }}>{label}</span>
    </div>
  );
}

function AssignmentCell({ theme, assignment, hasConflict, userMap, userA, userB }) {
  if (hasConflict || !assignment) {
    return (
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 2px', background: theme.conflictBg, border: `1px solid ${theme.conflict}`, margin: 1, borderRadius: 4 }}>
        <span style={{ fontSize: 14, color: theme.conflict }}>⚠️</span>
      </div>
    );
  }

  const user = userMap[assignment.user_id];
  const initials = (user?.name || '??').slice(0, 2).toUpperCase();
  const pillColor = user?.id === userA?.id ? theme.colorA : user?.id === userB?.id ? theme.colorB : theme.colorOcc;

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 2px', background: theme.surface, border: `1px solid ${theme.border}`, margin: 1, borderRadius: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: pillColor, borderRadius: 4, padding: '2px 6px' }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#ffffff' }}>{initials}</span>
      </div>
      {assignment.time && <span style={{ fontSize: 8, color: theme.textMuted, marginTop: 2 }}>{assignment.time}</span>}
    </div>
  );
}
