import React from 'react';

export default function WeekNav({ theme, label, onPrev, onNext }) {
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

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}>
      <div onClick={onPrev} style={btnStyle}>‹</div>
      <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{label}</span>
      <div onClick={onNext} style={btnStyle}>›</div>
    </div>
  );
}
