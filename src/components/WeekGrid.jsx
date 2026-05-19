import React, { useRef, useCallback } from 'react';
import { WEEKDAY_SHORT } from '../weekHelpers.js';

export default function WeekGrid({ theme, data, users, activeUserId, onDayClick, onQuickAssign, onQuickLocation, onTimeEdit }) {
  const days = data.days || [];
  const primaries = users.filter(u => u.type === 'primary' || !u.type);
  const [userA, userB] = primaries;
  const userMap = {};
  for (const u of users) userMap[u.id] = u;

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

  const isActiveRow = (user) => user && user.id === activeUserId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '0 12px 12px' }}>
      {/* Header row */}
      <div style={{ display: 'flex' }}>
        <div style={{ ...labelStyle, color: theme.textMuted }}></div>
        {days.map((day, i) => (
          <div key={i} onClick={() => onDayClick && onDayClick(i)} style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', padding: '6px 2px', borderBottom: `1px solid ${theme.border}`, cursor: onDayClick ? 'pointer' : 'default' }}>
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
          return <LocationCell key={i} theme={theme} loc={loc} isActiveUser={isActiveRow(userA)} onClick={(e) => onQuickLocation ? onQuickLocation(i, userA.id, e) : (onDayClick && onDayClick(i))} />;
        })}
      </div>

      {/* User B row */}
      <div style={{ display: 'flex' }}>
        <div style={{ ...labelStyle, color: theme.colorBText }}>{userB?.name || 'B'}</div>
        {days.map((day, i) => {
          const loc = (day.work_locations || []).find(w => userB && w.user_id === userB.id);
          return <LocationCell key={i} theme={theme} loc={loc} isActiveUser={isActiveRow(userB)} onClick={(e) => onQuickLocation ? onQuickLocation(i, userB.id, e) : (onDayClick && onDayClick(i))} />;
        })}
      </div>

      {/* Drop-off row */}
      <div style={{ display: 'flex', marginTop: 4 }}>
        <div style={{ ...labelStyle, color: theme.textMuted }}>Drop-off</div>
        {days.map((day, i) => {
          const hasConflict = (day.conflicts || []).some(c => c.includes('dropoff'));
          return <AssignmentCell key={i} theme={theme} assignment={day.dropoff} hasConflict={hasConflict} userMap={userMap} userA={userA} userB={userB} onClick={(e) => onQuickAssign ? onQuickAssign(i, 'dropoff', e) : (onDayClick && onDayClick(i))} onLongPress={(e) => onTimeEdit && onTimeEdit(i, 'dropoff', e)} />;
        })}
      </div>

      {/* Pick-up row */}
      <div style={{ display: 'flex' }}>
        <div style={{ ...labelStyle, color: theme.textMuted }}>Pick-up</div>
        {days.map((day, i) => {
          const hasConflict = (day.conflicts || []).some(c => c.includes('pickup'));
          return <AssignmentCell key={i} theme={theme} assignment={day.pickup} hasConflict={hasConflict} userMap={userMap} userA={userA} userB={userB} onClick={(e) => onQuickAssign ? onQuickAssign(i, 'pickup', e) : (onDayClick && onDayClick(i))} onLongPress={(e) => onTimeEdit && onTimeEdit(i, 'pickup', e)} />;
        })}
      </div>
    </div>
  );
}

function LocationCell({ theme, loc, isActiveUser, onClick }) {
  const location = loc?.work_location || null;
  const isHome = location === 'home';
  const isOffice = location === 'office';
  const isUnknown = !location || location === 'unknown';

  const icon = isOffice ? '🏢' : isHome ? '🏠' : null;
  const label = isOffice ? 'Office' : isHome ? 'WFH' : 'Unknown';
  const accentColor = isHome ? theme.locHome : isOffice ? theme.locOffice : theme.locUnknown;

  const cellStyle = {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 2px',
    background: isUnknown ? theme.bg : theme.surface,
    border: isUnknown ? `2px dashed ${theme.locUnknown}` : `1px solid ${theme.border}`,
    borderLeft: isUnknown ? `2px dashed ${theme.locUnknown}` : `4px solid ${accentColor}`,
    margin: 1,
    borderRadius: 4,
    cursor: onClick ? 'pointer' : 'default',
    opacity: isUnknown ? 0.7 : 1,
  };

  return (
    <div onClick={onClick} style={cellStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
        {isUnknown && <span style={{ fontSize: 14, fontWeight: 700, color: theme.textMuted }}>?</span>}
        <span style={{ fontSize: 8, fontWeight: 600, color: isUnknown ? theme.textMuted : accentColor, marginTop: 2 }}>{label}</span>
      </div>
    </div>
  );
}

function AssignmentCell({ theme, assignment, hasConflict, userMap, userA, userB, onClick, onLongPress }) {
  const timerRef = useRef(null);
  const longPressedRef = useRef(false);

  const startPress = (e) => {
    longPressedRef.current = false;
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      if (onLongPress) onLongPress(e);
    }, 500);
  };

  const endPress = (e) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (e) => {
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    if (onClick) onClick(e);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  const pressProps = {
    onMouseDown: startPress,
    onMouseUp: endPress,
    onMouseLeave: endPress,
    onTouchStart: startPress,
    onTouchEnd: endPress,
    onTouchMove: endPress,
    onClick: handleClick,
    onContextMenu: handleContextMenu,
  };

  if (hasConflict) {
    return (
      <div {...pressProps} style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 2px', background: theme.conflictBg, border: `2px solid ${theme.conflict}`, margin: 1, borderRadius: 4, cursor: 'pointer' }}>
        <span style={{ fontSize: 14, color: theme.conflict }}>⚠️</span>
      </div>
    );
  }

  if (!assignment || !assignment.user_id) {
    return (
      <div {...pressProps} style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 2px', background: theme.bg, border: `2px dashed ${theme.border}`, margin: 1, borderRadius: 4, cursor: 'pointer', opacity: 0.5 }}>
        <span style={{ fontSize: 9, color: theme.textMuted }}>Unset</span>
      </div>
    );
  }

  const user = userMap[assignment.user_id];
  const initials = (user?.name || '??').slice(0, 2).toUpperCase();
  const pillColor = user?.id === userA?.id ? theme.colorA : user?.id === userB?.id ? theme.colorB : theme.colorOcc;

  return (
    <div {...pressProps} style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 2px', background: theme.surface, border: `1px solid ${theme.border}`, margin: 1, borderRadius: 4, cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: pillColor, borderRadius: 4, padding: '2px 6px' }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#ffffff' }}>{initials}</span>
      </div>
      {assignment.time && <span style={{ fontSize: 8, color: theme.textMuted, marginTop: 2 }}>{assignment.time}</span>}
    </div>
  );
}
