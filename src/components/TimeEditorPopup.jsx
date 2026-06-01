import React, { useEffect, useRef, useState } from 'react';

export default function TimeEditorPopup({ theme, rect, currentTime, onSave, onClose }) {
  const ref = useRef(null);
  const [time, setTime] = useState(currentTime || '08:00');

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { onSave(time); } };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, onSave, time]);

  const top = rect.bottom + 4;
  const left = rect.left + rect.width / 2;

  return (
    <div ref={ref} style={{ position: 'fixed', top, left, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', background: theme.surface, borderRadius: 12, padding: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.25)', zIndex: 950, minWidth: 130 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, marginBottom: 8 }}>Set Time</span>
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSave(time); }}
        autoFocus
        style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 16, textAlign: 'center' }}
      />
      <div onClick={() => onSave(time)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8, padding: '6px 16px', borderRadius: 8, background: theme.colorA, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
        Save
      </div>
    </div>
  );
}
