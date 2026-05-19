import React, { useEffect, useRef } from 'react';

export default function QuickLocationPopup({ theme, rect, onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const top = rect.bottom + 4;
  const left = rect.left + rect.width / 2;

  const popupStyle = {
    position: 'fixed', top, left, transform: 'translateX(-50%)',
    display: 'flex', flexDirection: 'column',
    background: theme.surface, borderRadius: 12, padding: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)', zIndex: 950, minWidth: 120,
  };

  const btnStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '10px 16px', borderRadius: 8,
    background: theme.bg, color: theme.text,
    fontWeight: 700, fontSize: 14, cursor: 'pointer',
    border: `2px solid ${theme.border}`,
  };

  return (
    <div ref={ref} style={popupStyle}>
      <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, marginBottom: 8, textAlign: 'center' }}>Work Location</span>
      <div onClick={() => onSelect('home')} style={btnStyle}>🏠 Home</div>
      <div onClick={() => onSelect('office')} style={{ ...btnStyle, marginTop: 6 }}>🏢 Office</div>
    </div>
  );
}
