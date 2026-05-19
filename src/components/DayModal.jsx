import React, { useState } from 'react';
import { WEEKDAY_SHORT } from '../weekHelpers.js';

export default function DayModal({ theme, day, dayIndex, users, onClose, onSaved }) {
  const primaries = users.filter(u => u.type === 'primary' || !u.type);
  const allAssignable = [{ id: null, name: 'Nobody' }, ...users];

  const getLocFor = (uid) => {
    const wl = (day.work_locations || []).find(w => w.user_id === uid);
    return wl?.work_location || 'home';
  };

  const [locations, setLocations] = useState(() => {
    const m = {};
    primaries.forEach(u => { m[u.id] = getLocFor(u.id); });
    return m;
  });
  const [dropoffUserId, setDropoffUserId] = useState(day.dropoff?.user_id || null);
  const [dropoffTime, setDropoffTime] = useState(day.dropoff?.time || '08:00');
  const [pickupUserId, setPickupUserId] = useState(day.pickup?.user_id || null);
  const [pickupTime, setPickupTime] = useState(day.pickup?.time || '15:00');
  const [saving, setSaving] = useState(false);

  const toggleLoc = (uid) => {
    setLocations(l => ({ ...l, [uid]: l[uid] === 'home' ? 'office' : 'home' }));
  };

  const save = async () => {
    setSaving(true);
    try {
      for (const u of primaries) {
        await fetch(`/api/days/${day.date}/user/${u.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ work_location: locations[u.id] }) });
      }
      await fetch(`/api/assignments/${day.date}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dropoff_user_id: dropoffUserId, dropoff_time: dropoffTime, pickup_user_id: pickupUserId, pickup_time: pickupTime }) });
      onSaved();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const backdrop = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 900 };
  const modal = { display: 'flex', flexDirection: 'column', background: theme.surface, borderRadius: 12, padding: 20, width: 300, maxWidth: '90vw' };
  const sectionTitle = { fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 6, marginTop: 12 };
  const selectStyle = { padding: '6px 10px', borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 13, flex: 1 };
  const timeStyle = { padding: '6px 8px', borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 13, width: 70 };
  const btnStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', borderRadius: 8, background: theme.colorA, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none' };

  const dayLabel = `${WEEKDAY_SHORT[dayIndex]} ${day.date?.slice(5)}`;

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ flex: 1, fontSize: 16, fontWeight: 700, color: theme.text }}>{dayLabel}</span>
          <div onClick={onClose} style={{ cursor: 'pointer', fontSize: 18, color: theme.textMuted }}>✕</div>
        </div>

        <span style={sectionTitle}>Work Location</span>
        {primaries.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ flex: 1, fontSize: 13, color: theme.text }}>{u.name}</span>
            <div onClick={() => toggleLoc(u.id)} style={{ display: 'flex', alignItems: 'center', padding: '4px 10px', borderRadius: 6, background: locations[u.id] === 'home' ? theme.colorALight : theme.colorBLight, border: `1px solid ${theme.border}`, cursor: 'pointer' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{locations[u.id] === 'home' ? '🏠 Home' : '🏢 Office'}</span>
            </div>
          </div>
        ))}

        <span style={sectionTitle}>Drop-off</span>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <select style={selectStyle} value={dropoffUserId || ''} onChange={e => setDropoffUserId(e.target.value ? parseInt(e.target.value) : null)}>
            {allAssignable.map(u => <option key={u.id || 'none'} value={u.id || ''}>{u.name}</option>)}
          </select>
          <input type="time" style={{ ...timeStyle, marginLeft: 6 }} value={dropoffTime} onChange={e => setDropoffTime(e.target.value)} />
        </div>

        <span style={sectionTitle}>Pick-up</span>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <select style={selectStyle} value={pickupUserId || ''} onChange={e => setPickupUserId(e.target.value ? parseInt(e.target.value) : null)}>
            {allAssignable.map(u => <option key={u.id || 'none'} value={u.id || ''}>{u.name}</option>)}
          </select>
          <input type="time" style={{ ...timeStyle, marginLeft: 6 }} value={pickupTime} onChange={e => setPickupTime(e.target.value)} />
        </div>

        <div onClick={save} style={{ ...btnStyle, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save'}
        </div>
      </div>
    </div>
  );
}
