import React, { useState } from 'react';

export default function SettingsModal({ theme, users, onClose, onSaved }) {
  const primaries = users.filter(u => u.type === 'primary' || !u.type);
  const occasionals = users.filter(u => u.type === 'occasional');
  const [names, setNames] = useState(() => {
    const m = {};
    primaries.forEach(u => { m[u.id] = u.name; });
    return m;
  });
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const updateName = (id, val) => setNames(n => ({ ...n, [id]: val }));

  const save = async () => {
    setSaving(true);
    try {
      for (const u of primaries) {
        if (names[u.id] && names[u.id] !== u.name) {
          await fetch(`/api/users/${u.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: names[u.id] }) });
        }
      }
      onSaved();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const addOccasional = async () => {
    if (!newName.trim()) return;
    await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim(), type: 'occasional' }) });
    setNewName('');
    onSaved();
  };

  const removeOccasional = async (id) => {
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    onSaved();
  };

  const backdrop = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 900 };
  const modal = { display: 'flex', flexDirection: 'column', background: theme.surface, borderRadius: 12, padding: 20, width: 300, maxWidth: '90vw' };
  const inputStyle = { padding: '6px 10px', borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 14, width: '100%' };
  const btnStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', borderRadius: 8, background: theme.colorA, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none' };

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ flex: 1, fontSize: 16, fontWeight: 700, color: theme.text }}>Settings</span>
          <div onClick={onClose} style={{ cursor: 'pointer', fontSize: 18, color: theme.textMuted }}>✕</div>
        </div>

        <span style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 6 }}>Primary Users</span>
        {primaries.map(u => (
          <div key={u.id} style={{ display: 'flex', marginBottom: 8 }}>
            <input style={inputStyle} value={names[u.id] || ''} onChange={e => updateName(u.id, e.target.value)} />
          </div>
        ))}

        <span style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 6, marginTop: 12 }}>Occasional People</span>
        {occasionals.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ flex: 1, fontSize: 13, color: theme.text }}>{u.name}</span>
            <div onClick={() => removeOccasional(u.id)} style={{ cursor: 'pointer', fontSize: 14, color: theme.conflict }}>🗑️</div>
          </div>
        ))}
        <div style={{ display: 'flex', marginBottom: 16 }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="New name" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOccasional()} />
          <div onClick={addOccasional} style={{ ...btnStyle, marginLeft: 6, padding: '6px 10px', fontSize: 16 }}>+</div>
        </div>

        <div onClick={save} style={{ ...btnStyle, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save'}
        </div>
      </div>
    </div>
  );
}
