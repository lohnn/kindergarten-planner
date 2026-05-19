import React, { useRef, useCallback } from 'react';
import { WEEKDAY_SHORT } from '../weekHelpers.js';

export default function WeekGrid({ theme, data, users, activeUserId, todayIndex, onDayClick, onQuickAssign, onQuickLocation, onTimeEdit }) {
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
        {days.map((day, i) => {
          const isToday = todayIndex === i;
          const headerStyle = {
            display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center',
            padding: '6px 2px',
            borderBottom: isToday ? `2px solid ${theme.todayRing}` : `1px solid ${theme.border}`,
            background: isToday ? theme.todayHeaderBg : 'transparent',
            borderRadius: isToday ? '4px 4px 0 0' : 0,
            cursor: onDayClick ? 'pointer' : 'default',
          };
          return (
            <div key={i} onClick={() => onDayClick && onDayClick(i)} style={headerStyle}>
              <span style={{ fontSize: 10, fontWeight: isToday ? 800 : 700, color: isToday ? theme.todayHeaderText : theme.textMuted }}>{WEEKDAY_SHORT[i]}</span>
              <span style={{ fontSize: 9, color: isToday ? theme.todayHeaderText : theme.textMuted, fontWeight: isToday ? 700 : 400 }}>{day.date?.slice(8, 10)}</span>
            </div>
          );
        })}
      </div>

      {/* User A row */}
      <div style={{ display: 'flex' }}>
        <div style={{ ...labelStyle, color: theme.colorAText }}>{userA?.name || 'A'}</div>
        {days.map((day, i) => {
          const loc = (day.work_locations || []).find(w => userA && w.user_id === userA.id);
          const isToday = todayIndex === i;
          return <LocationCell key={i} theme={theme} loc={loc} isActiveUser={isActiveRow(userA)} userColor={theme.colorA} isToday={isToday} onClick={(e) => onQuickLocation ? onQuickLocation(i, userA.id, e) : (onDayClick && onDayClick(i))} />;
        })}
      </div>

      {/* User B row */}
      <div style={{ display: 'flex' }}>
        <div style={{ ...labelStyle, color: theme.colorBText }}>{userB?.name || 'B'}</div>
        {days.map((day, i) => {
          const loc = (day.work_locations || []).find(w => userB && w.user_id === userB.id);
          const isToday = todayIndex === i;
          return <LocationCell key={i} theme={theme} loc={loc} isActiveUser={isActiveRow(userB)} userColor={theme.colorB} isToday={isToday} onClick={(e) => onQuickLocation ? onQuickLocation(i, userB.id, e) : (onDayClick && onDayClick(i))} />;
        })}
      </div>

      {/* Drop-off row */}
      <div style={{ display: 'flex', marginTop: 4 }}>
        <div style={{ ...labelStyle, color: theme.textMuted }}>Drop-off</div>
        {days.map((day, i) => {
          const hasConflict = (day.conflicts || []).some(c => c.includes('dropoff'));
          const isToday = todayIndex === i;
          return <AssignmentCell key={i} theme={theme} assignment={day.dropoff} hasConflict={hasConflict} userMap={userMap} userA={userA} userB={userB} activeUserId={activeUserId} isToday={isToday} onClick={(e) => onQuickAssign ? onQuickAssign(i, 'dropoff', e) : (onDayClick && onDayClick(i))} onLongPress={(e) => onTimeEdit && onTimeEdit(i, 'dropoff', e)} />;
        })}
      </div>

      {/* Pick-up row */}
      <div style={{ display: 'flex' }}>
        <div style={{ ...labelStyle, color: theme.textMuted }}>Pick-up</div>
        {days.map((day, i) => {
          const hasConflict = (day.conflicts || []).some(c => c.includes('pickup'));
          const isToday = todayIndex === i;
          return <AssignmentCell key={i} theme={theme} assignment={day.pickup} hasConflict={hasConflict} userMap={userMap} userA={userA} userB={userB} activeUserId={activeUserId} isToday={isToday} onClick={(e) => onQuickAssign ? onQuickAssign(i, 'pickup', e) : (onDayClick && onDayClick(i))} onLongPress={(e) => onTimeEdit && onTimeEdit(i, 'pickup', e)} />;
        })}
      </div>
    </div>
  );
}

function LocationCell({ theme, loc, isActiveUser, userColor, isToday, onClick }) {
  const location = loc?.work_location || null;
  const isHome = location === 'home';
  const isOffice = location === 'office';
  const isUnknown = !location || location === 'unknown';

  const icon = isOffice ? '🏢' : isHome ? '🏠' : null;
  const label = isOffice ? 'Office' : isHome ? 'WFH' : 'Unknown';
  const accentColor = isHome ? theme.locHome : isOffice ? theme.locOffice : theme.locUnknown;

  // Today column tint blended over the cell's natural background
  const baseBg = isUnknown ? theme.bg : theme.surface;

  // Active-user border: 2px solid in user identity color, overrides default borders
  const borderBase = isActiveUser
    ? `2px solid ${userColor}`
    : isUnknown
      ? `2px dashed ${theme.locUnknown}`
      : `1px solid ${theme.border}`;
  const borderLeft = isActiveUser
    ? `2px solid ${userColor}`
    : isUnknown
      ? `2px dashed ${theme.locUnknown}`
      : `4px solid ${accentColor}`;

  const cellStyle = {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 2px',
    position: 'relative',
    background: baseBg,
    border: borderBase,
    borderLeft,
    margin: 1,
    borderRadius: 4,
    cursor: onClick ? 'pointer' : 'default',
    opacity: isUnknown ? 0.7 : 1,
    overflow: 'hidden',
  };

  return (
    <div onClick={onClick} style={cellStyle}>
      {isToday && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: theme.todayColBg, pointerEvents: 'none' }} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
        {isUnknown && <span style={{ fontSize: 14, fontWeight: 700, color: theme.textMuted }}>?</span>}
        <span style={{ fontSize: 8, fontWeight: 600, color: isUnknown ? theme.textMuted : accentColor, marginTop: 2 }}>{label}</span>
      </div>
    </div>
  );
}

function AssignmentCell({ theme, assignment, hasConflict, userMap, userA, userB, activeUserId, isToday, onClick, onLongPress }) {
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
      <div {...pressProps} style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 2px', position: 'relative', overflow: 'hidden', background: theme.conflictBg, border: `2px solid ${theme.conflict}`, margin: 1, borderRadius: 4, cursor: 'pointer' }}>
        {isToday && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: theme.todayColBg, pointerEvents: 'none' }} />}
        <span style={{ fontSize: 14, color: theme.conflict, position: 'relative' }}>⚠️</span>
      </div>
    );
  }

  if (!assignment || !assignment.user_id) {
    return (
      <div {...pressProps} style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 2px', position: 'relative', overflow: 'hidden', background: theme.bg, border: `2px dashed ${theme.border}`, margin: 1, borderRadius: 4, cursor: 'pointer', opacity: 0.5 }}>
        {isToday && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: theme.todayColBg, pointerEvents: 'none' }} />}
        <span style={{ fontSize: 9, color: theme.textMuted, position: 'relative' }}>Unset</span>
      </div>
    );
  }

  const user = userMap[assignment.user_id];
  const initials = (user?.name || '??').slice(0, 2).toUpperCase();
  const pillColor = user?.id === userA?.id ? theme.colorA : user?.id === userB?.id ? theme.colorB : theme.colorOcc;

  // Active-user border: if the assigned user is the currently active user
  const isAssignedToActiveUser = assignment.user_id === activeUserId;
  const activeUserColor = isAssignedToActiveUser
    ? (assignment.user_id === userA?.id ? theme.colorA : assignment.user_id === userB?.id ? theme.colorB : null)
    : null;
  const assignedBorder = activeUserColor ? `2px solid ${activeUserColor}` : `1px solid ${theme.border}`;

  return (
    <div {...pressProps} style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 2px', position: 'relative', overflow: 'hidden', background: theme.surface, border: assignedBorder, margin: 1, borderRadius: 4, cursor: 'pointer' }}>
      {isToday && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: theme.todayColBg, pointerEvents: 'none' }} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: pillColor, borderRadius: 4, padding: '2px 6px', position: 'relative' }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#ffffff' }}>{initials}</span>
      </div>
      {assignment.time && <span style={{ fontSize: 8, color: theme.textMuted, marginTop: 2, position: 'relative' }}>{assignment.time}</span>}
    </div>
  );
}
