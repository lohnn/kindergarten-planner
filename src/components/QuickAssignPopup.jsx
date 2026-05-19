import React, { useEffect, useRef } from 'react';
import { smartPosition } from '../useSmartPosition.js';

export default function QuickAssignPopup({ theme, users, field, rect, onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const allAssignable = [{ id: null, name: 'Nobody', type: 'none' }, ...users];
  const label = field === 'dropoff' ? 'Drop-off' : 'Pick-up';

  const itemCount = users.length + 1; // +1 for Nobody
  const pos = smartPosition(rect, { width: 160, height: 52 + itemCount * 44 });

  const popupStyle = {
    position: 'fixed',
    top: pos.top,
    left: pos.left,
    transform: pos.transform,
    display: 'flex',
    flexDirection: 'column',
    background: theme.surface,
    borderRadius: 12,
    padding: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
    zIndex: 950,
    minWidth: 140,
  };

  const titleStyle = {
    fontSize: 11,
    fontWeight: 600,
    color: theme.textMuted,
    marginBottom: 8,
    textAlign: 'center',
  };

  const primaries = users.filter(u => u.type === 'primary' || !u.type);
  const [userA] = primaries;

  return (
    <div ref={ref} style={popupStyle}>
      <span style={titleStyle}>{label}</span>
      {allAssignable.map((u, idx) => {
        const isNobody = u.id === null;
        const btnColor = isNobody ? theme.textMuted : (u.id === userA?.id ? theme.colorA : (u.type === 'occasional' ? theme.colorOcc : theme.colorB));
        return (
          <div
            key={u.id || 'none'}
            onClick={() => onSelect(u.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 16px',
              marginTop: idx > 0 ? 6 : 0,
              borderRadius: 8,
              background: isNobody ? theme.bg : btnColor,
              color: isNobody ? theme.textMuted : '#ffffff',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              border: isNobody ? `2px solid ${theme.border}` : '2px solid transparent',
            }}
          >
            {u.name}
          </div>
        );
      })}
    </div>
  );
}
