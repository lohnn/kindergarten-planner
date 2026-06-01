export function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return {
    week: Math.ceil(((d - yearStart) / 86400000 + 1) / 7),
    year: d.getUTCFullYear(),
  };
}

export function weekToMonday(year, week) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (dow - 1) + (week - 1) * 7);
  return monday;
}

export function addWeeks(year, week, delta) {
  const monday = weekToMonday(year, week);
  monday.setUTCDate(monday.getUTCDate() + delta * 7);
  return getISOWeek(monday);
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function formatWeekLabel(year, week) {
  const mon = weekToMonday(year, week);
  const fri = new Date(mon);
  fri.setUTCDate(mon.getUTCDate() + 4);
  const m1 = MONTH_NAMES[mon.getUTCMonth()];
  const m2 = MONTH_NAMES[fri.getUTCMonth()];
  const label = m1 === m2
    ? `${m1} ${mon.getUTCDate()}–${fri.getUTCDate()}, ${year}`
    : `${m1} ${mon.getUTCDate()} – ${m2} ${fri.getUTCDate()}, ${year}`;
  return `Week of ${label}`;
}

export const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
