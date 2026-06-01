import React from 'react';

export default function Header({ theme, users, activeUserId, onSelectUser, isDark, onToggleTheme, onOpenSettings }) {
  const [userA, userB] = users;

  const btnStyle = (isActive, colorLight, colorBorder, colorText) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 14px',
    borderRadius: 8,
    border: `2px solid ${isActive ? colorBorder : theme.border}`,
    background: isActive ? colorLight : theme.surface,
    color: isActive ? colorText : theme.textMuted,
    fontWeight: isActive ? 700 : 600,
    fontSize: 13,
    cursor: 'pointer',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '12px 12px 8px', background: theme.surface, borderBottom: `1px solid ${theme.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: theme.text, flex: 1 }}>🎒 Kinder Planner</span>
        {onToggleTheme && (
          <div
            onClick={onToggleTheme}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', background: theme.bg, border: `1px solid ${theme.border}`, fontSize: 16, marginRight: 6 }}
          >
            {isDark ? '☀️' : '🌙'}
          </div>
        )}
        {onOpenSettings && (
          <div
            onClick={onOpenSettings}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', background: theme.bg, border: `1px solid ${theme.border}`, fontSize: 16 }}
          >
            ⚙️
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: theme.textMuted, marginRight: 8 }}>I am:</span>
        <div
          onClick={() => userA && onSelectUser(userA.id)}
          style={btnStyle(activeUserId === userA?.id, theme.colorALight, theme.colorA, theme.colorAText)}
        >
          {userA?.name || 'Person A'}
        </div>
        <div style={{ width: 6 }} />
        <div
          onClick={() => userB && onSelectUser(userB.id)}
          style={btnStyle(activeUserId === userB?.id, theme.colorBLight, theme.colorB, theme.colorBText)}
        >
          {userB?.name || 'Person B'}
        </div>
      </div>
    </div>
  );
}
