import React, { useState, useEffect } from 'react';
import { WEEKDAY_SHORT } from '../weekHelpers.js';

export default function DayModal({ theme, day, dayIndex, users, onClose, onSaved }) {
  const primaries = users.filter(u => u.type === 'primary' || !u.type);
  const allAssignable = [{ id: null, name: 'Nobody', type: 'none' }, ...users];

  const getLocFor = (uid) => {
    const wl = (day.work_locations || []).find(w => w.user_id === uid);
    return wl?.work_location || 'unknown';
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

  const cycleLoc = (uid) => {
    setLocations(l => {
      const cur = l[uid];
      const next = cur === 'home' ? 'office' : cur === 'office' ? 'unknown' : 'home';
      return { ...l, [uid]: next };
    });
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

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && !(document.activeElement && document.activeElement.matches('input[type="time"]'))) save();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, dropoffUserId, dropoffTime, pickupUserId, pickupTime, locations]);

  const backdrop = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 900 };
  const modal = { display: 'flex', flexDirection: 'column', background: theme.surface, borderRadius: 12, padding: 20, width: 300, maxWidth: '90vw' };
  const sectionTitle = { fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 6, marginTop: 12 };
  const timeStyle = { padding: '6px 8px', borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 13, width: 70 };
  const btnStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', borderRadius: 8, background: theme.colorA, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none' };

  const dayLabel = `${WEEKDAY_SHORT[dayIndex]} ${day.date?.slice(5)}`;

  const [userA] = primaries;

  const renderToggleButtons = (selectedId, setSelectedId) => (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {allAssignable.map((u, idx) => {
        const isSelected = u.id === selectedId;
        const isNobody = u.id === null;
        const btnColor = isNobody ? theme.textMuted : (u.id === userA?.id ? theme.colorA : (u.type === 'occasional' ? theme.colorOcc : theme.colorB));
        return (
          <div
            key={u.id || 'none'}
            onClick={() => setSelectedId(u.id)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: isSelected
                ? `2px solid ${isNobody ? theme.textMuted : btnColor}`
                : `2px solid ${theme.border}`,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              marginLeft: idx > 0 ? 6 : 0,
              background: isSelected ? (isNobody ? theme.surface : btnColor) : theme.surface,
              color: isSelected ? (isNobody ? theme.textMuted : '#fff') : theme.text,
            }}
          >
            {u.name}
          </div>
        );
      })}
    </div>
  );

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
            <div onClick={() => cycleLoc(u.id)} style={{ display: 'flex', alignItems: 'center', padding: '4px 10px', borderRadius: 6, background: locations[u.id] === 'home' ? theme.locHomeBg : locations[u.id] === 'office' ? theme.locOfficeBg : theme.surface, border: locations[u.id] === 'unknown' ? `2px dashed ${theme.locUnknown}` : `1px solid ${theme.border}`, cursor: 'pointer' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: locations[u.id] === 'home' ? theme.locHome : locations[u.id] === 'office' ? theme.locOffice : theme.locUnknown }}>{locations[u.id] === 'home' ? '🏠 Home' : locations[u.id] === 'office' ? '🏢 Office' : '❓ Unknown'}</span>
            </div>
          </div>
        ))}

        <span style={sectionTitle}>Drop-off</span>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          {renderToggleButtons(dropoffUserId, setDropoffUserId)}
          <input type="time" style={{ ...timeStyle, marginLeft: 6 }} value={dropoffTime} onChange={e => setDropoffTime(e.target.value)} />
        </div>

        <span style={sectionTitle}>Pick-up</span>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          {renderToggleButtons(pickupUserId, setPickupUserId)}
          <input type="time" style={{ ...timeStyle, marginLeft: 6 }} value={pickupTime} onChange={e => setPickupTime(e.target.value)} />
        </div>

        <div onClick={save} style={{ ...btnStyle, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save'}
        </div>
      </div>
    </div>
  );
}
