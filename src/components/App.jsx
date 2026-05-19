import React, { useState, useEffect } from 'react';
import { themes } from '../theme.js';
import { useTheme, ThemeContext } from '../useTheme.js';
import { getISOWeek, addWeeks, formatWeekLabel } from '../weekHelpers.js';
import Header from './Header.jsx';
import WeekNav from './WeekNav.jsx';
import WeekGrid from './WeekGrid.jsx';

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path}: ${res.status}`);
  return res.json();
}

export default function App({ data, theme: themeProp } = {}) {
  // If data is passed directly (snapshot mode), render statically with specified theme
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

  useEffect(() => {
    apiGet('/api/users').then(setUsers).catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiGet(`/api/weeks/${yearWeek.year}/${yearWeek.week}`)
      .then(d => { setWeekData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [yearWeek]);

  const navigate = (delta) => {
    const { year, week } = addWeeks(yearWeek.year, yearWeek.week, delta);
    setYearWeek({ year, week });
  };

  const selectUser = (id) => {
    setActiveUserId(id);
    if (id) localStorage.setItem('kinder_user_id', String(id));
    else localStorage.removeItem('kinder_user_id');
  };

  const primaries = users.filter(u => u.type === 'primary' || !u.type);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: theme.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Header theme={theme} users={primaries} activeUserId={activeUserId} onSelectUser={selectUser} isDark={isDark} onToggleTheme={toggleTheme} />
      <WeekNav theme={theme} label={formatWeekLabel(yearWeek.year, yearWeek.week)} onPrev={() => navigate(-1)} onNext={() => navigate(1)} />
      {loading && <div style={{ padding: 20, textAlign: 'center', color: theme.textMuted }}>Loading...</div>}
      {error && <div style={{ padding: 20, textAlign: 'center', color: theme.conflict }}>{error}</div>}
      {weekData && !loading && <WeekGrid theme={theme} data={weekData} users={users} />}
    </div>
  );
}

function AppView({ data, theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: theme.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: 12 }}>
      <Header theme={theme} users={(data.users || []).filter(u => u.type === 'primary' || !u.type)} activeUserId={1} onSelectUser={() => {}} />
      <WeekNav theme={theme} label={`Week ${data.week || ''}, ${data.year || ''}`} onPrev={() => {}} onNext={() => {}} />
      <WeekGrid theme={theme} data={data} users={data.users || []} />
    </div>
  );
}
