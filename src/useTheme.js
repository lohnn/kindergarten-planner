import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { themes } from './theme.js';

const STORAGE_KEY = 'kinder_theme';

function getSystemDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getStoredPreference() {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return null;
}

export function useTheme() {
  const [manualChoice, setManualChoice] = useState(getStoredPreference);
  const [systemDark, setSystemDark] = useState(getSystemDark);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isDark = manualChoice ? manualChoice === 'dark' : systemDark;
  const themeName = isDark ? 'dark' : 'light';
  const theme = themes[themeName];

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    setManualChoice(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, [isDark]);

  return { theme, isDark, toggleTheme, themeName };
}

export const ThemeContext = createContext(null);

export function useThemeContext() {
  return useContext(ThemeContext);
}
