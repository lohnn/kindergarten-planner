import React, { useState, useEffect, useCallback } from 'react';
import { themes } from '../theme.js';
import { useTheme, ThemeContext } from '../useTheme.js';
import { getISOWeek, addWeeks, formatWeekLabel } from '../weekHelpers.js';
import Header from './Header.jsx';
import WeekNav from './WeekNav.jsx';
import WeekGrid from './WeekGrid.jsx';
import SettingsModal from './SettingsModal.jsx';
import DayModal from './DayModal.jsx';
import QuickAssignPopup from './QuickAssignPopup.jsx';
import QuickLocationPopup from './QuickLocationPopup.jsx';
import TimeEditorPopup from './TimeEditorPopup.jsx';

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path}: ${res.status}`);
  return res.json();
}

export default function App({ data, theme: themeProp } = {}) {
  if (data) {
    const t = themes[themeProp || 'light'];
    return <AppView data={data} theme={t} />;
  }
  return <AppWithTheme />;
}

function AppWithTheme() {
  const themeState = useTheme();
  return (
    <ThemeContext.Provider value={themeState}>
      <AppInteractive theme={themeState.theme} isDark={themeState.isDark} toggleTheme={themeState.toggleTheme} />
    </ThemeContext.Provider>
  );
}

function AppInteractive({ theme, isDark, toggleTheme }) {
  const [users, setUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState(() => {
    return parseInt(localStorage.getItem('kinder_user_id') || '0', 10) || null;
  });
  const [yearWeek, setYearWeek] = useState(() => {
    const { year, week } = getISOWeek(new Date());
    return { year, week };
  });
  const [weekData, setWeekData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [toast, setToast] = useState(null);
  const [quickAssign, setQuickAssign] = useState(null);
  const [quickLocation, setQuickLocation] = useState(null);
  const [timeEditor, setTimeEditor] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const fetchUsers = useCallback(() => {
    apiGet('/api/users').then(setUsers).catch(e => setError(e.message));
  }, []);

  const fetchWeek = useCallback(() => {
    setLoading(true);
    setError(null);
    apiGet(`/api/weeks/${yearWeek.year}/${yearWeek.week}`)
      .then(d => { setWeekData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [yearWeek]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchWeek(); }, [fetchWeek]);

  const navigate = (delta) => {
    const { year, week } = addWeeks(yearWeek.year, yearWeek.week, delta);
    setYearWeek({ year, week });
  };

  const selectUser = (id) => {
    setActiveUserId(id);
    if (id) localStorage.setItem('kinder_user_id', String(id));
    else localStorage.removeItem('kinder_user_id');
  };

  const handleQuickAssign = (dayIndex, field, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setQuickAssign({ dayIndex, field, rect });
  };

  const saveQuickAssign = async (userId) => {
    if (!quickAssign || !weekData) return;
    const day = weekData.days[quickAssign.dayIndex];
    const defaultDropoff = localStorage.getItem('kinder_default_dropoff') || '08:00';
    const defaultPickup = localStorage.getItem('kinder_default_pickup') || '15:00';

    const currentField = quickAssign.field === 'dropoff' ? day.dropoff : day.pickup;
    const isFromNobody = !currentField?.user_id;

    const body = quickAssign.field === 'dropoff'
      ? {
          dropoff_user_id: userId,
          dropoff_time: (isFromNobody && userId) ? defaultDropoff : (day.dropoff?.time || defaultDropoff),
          pickup_user_id: day.pickup?.user_id || null,
          pickup_time: day.pickup?.time || defaultPickup
        }
      : {
          dropoff_user_id: day.dropoff?.user_id || null,
          dropoff_time: day.dropoff?.time || defaultDropoff,
          pickup_user_id: userId,
          pickup_time: (isFromNobody && userId) ? defaultPickup : (day.pickup?.time || defaultPickup)
        };
    await fetch(`/api/assignments/${day.date}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setQuickAssign(null);
    fetchWeek();
    showToast(`${quickAssign.field === 'dropoff' ? 'Drop-off' : 'Pick-up'} updated`);
  };

  const handleQuickLocation = (dayIndex, userId, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setQuickLocation({ dayIndex, userId, rect });
  };

  const saveQuickLocation = async (location) => {
    if (!quickLocation || !weekData) return;
    const day = weekData.days[quickLocation.dayIndex];
    await fetch(`/api/days/${day.date}/user/${quickLocation.userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ work_location: location })
    });
    setQuickLocation(null);
    fetchWeek();
    showToast('Location updated');
  };

  const handleTimeEdit = (dayIndex, field, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTimeEditor({ dayIndex, field, rect });
  };

  const saveTimeEdit = async (time) => {
    if (!timeEditor || !weekData) return;
    const day = weekData.days[timeEditor.dayIndex];
    const body = timeEditor.field === 'dropoff'
      ? { dropoff_user_id: day.dropoff?.user_id || null, dropoff_time: time, pickup_user_id: day.pickup?.user_id || null, pickup_time: day.pickup?.time || '15:00' }
      : { dropoff_user_id: day.dropoff?.user_id || null, dropoff_time: day.dropoff?.time || '08:00', pickup_user_id: day.pickup?.user_id || null, pickup_time: time };
    await fetch(`/api/assignments/${day.date}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setTimeEditor(null);
    fetchWeek();
    showToast('Time updated');
  };

  const handleDayClick = (i) => {
    setQuickAssign(null);
    setQuickLocation(null);
    setTimeEditor(null);
    setSelectedDay(i);
  };

  const primaries = users.filter(u => u.type === 'primary' || !u.type);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: theme.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Header theme={theme} users={primaries} activeUserId={activeUserId} onSelectUser={selectUser} isDark={isDark} onToggleTheme={toggleTheme} onOpenSettings={() => setShowSettings(true)} />
      <WeekNav theme={theme} label={formatWeekLabel(yearWeek.year, yearWeek.week)} onPrev={() => navigate(-1)} onNext={() => navigate(1)} />
      {loading && <div style={{ padding: 20, textAlign: 'center', color: theme.textMuted }}>Loading...</div>}
      {error && <div style={{ padding: 20, textAlign: 'center', color: theme.conflict }}>{error}</div>}
      {weekData && !loading && <WeekGrid theme={theme} data={weekData} users={users} activeUserId={activeUserId} onDayClick={handleDayClick} onQuickAssign={handleQuickAssign} onQuickLocation={handleQuickLocation} onTimeEdit={handleTimeEdit} />}
      {quickAssign && <QuickAssignPopup theme={theme} users={users} field={quickAssign.field} rect={quickAssign.rect} onSelect={saveQuickAssign} onClose={() => setQuickAssign(null)} />}
      {quickLocation && <QuickLocationPopup theme={theme} rect={quickLocation.rect} onSelect={saveQuickLocation} onClose={() => setQuickLocation(null)} />}
      {timeEditor && weekData && (
        <TimeEditorPopup
          theme={theme}
          rect={timeEditor.rect}
          currentTime={timeEditor.field === 'dropoff' ? (weekData.days[timeEditor.dayIndex]?.dropoff?.time || '08:00') : (weekData.days[timeEditor.dayIndex]?.pickup?.time || '15:00')}
          onSave={saveTimeEdit}
          onClose={() => setTimeEditor(null)}
        />
      )}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: theme.text, color: theme.bg, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 1000 }}>
          {toast}
        </div>
      )}
      {showSettings && <SettingsModal theme={theme} users={users} onClose={() => setShowSettings(false)} onSaved={() => { fetchUsers(); fetchWeek(); showToast('Settings saved'); }} />}
      {selectedDay !== null && weekData && (
        <DayModal
          theme={theme}
          day={weekData.days[selectedDay]}
          dayIndex={selectedDay}
          users={users}
          onClose={() => setSelectedDay(null)}
          onSaved={() => { fetchWeek(); setSelectedDay(null); showToast('Day updated'); }}
        />
      )}
    </div>
  );
}

function AppView({ data, theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: theme.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: 12 }}>
      <Header theme={theme} users={(data.users || []).filter(u => u.type === 'primary' || !u.type)} activeUserId={1} onSelectUser={() => {}} />
      <WeekNav theme={theme} label={`Week ${data.week || ''}, ${data.year || ''}`} onPrev={() => {}} onNext={() => {}} />
      <WeekGrid theme={theme} data={data} users={data.users || []} activeUserId={1} />
    </div>
  );
}
