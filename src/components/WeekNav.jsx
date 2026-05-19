import React from 'react';

export default function WeekNav({ theme, label, onPrev, onNext, isCurrentWeek, onGoToToday }) {
  const btnStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 8,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    color: theme.text,
    fontSize: 20,
    cursor: 'pointer',
  };

  const todayBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    padding: '0 10px',
    borderRadius: 6,
    border: `1px solid ${theme.todayRing}`,
    background: theme.todayHeaderBg,
    color: theme.todayHeaderText,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}>
      <div onClick={onPrev} style={btnStyle}>‹</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{label}</span>
        {!isCurrentWeek && onGoToToday && (
          <div onClick={onGoToToday} style={todayBtnStyle}>← Today</div>
        )}
      </div>
      <div onClick={onNext} style={btnStyle}>›</div>
    </div>
  );
}

