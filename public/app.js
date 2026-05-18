/* ── Kinder Planner — app.js ── */

// ── ISO week helpers ──────────────────────────────────────────────────────────
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday (makes week start on Monday)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return {
    week: Math.ceil((((d - yearStart) / 86400000) + 1) / 7),
    year: d.getUTCFullYear()
  };
}

function addWeeks(year, week, delta) {
  // Convert to Monday date, add delta*7 days, recompute
  const monday = weekToMonday(year, week);
  monday.setUTCDate(monday.getUTCDate() + delta * 7);
  return getISOWeek(monday);
}

function weekToMonday(year, week) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (dow - 1) + (week - 1) * 7);
  return monday;
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAY_SHORT = ['Mon','Tue','Wed','Thu','Fri'];

function formatWeekLabel(year, week) {
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

// ── API ───────────────────────────────────────────────────────────────────────
async function apiGet(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function apiPut(path, body) {
  const res = await fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `PUT ${path} failed: ${res.status}`);
  }
  return res.json();
}

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  users: [],          // [{id, name}, ...]
  activeUserId: null, // from localStorage
  year: null,
  week: null,
  weekData: null,     // API response
  // day modal
  modalDate: null,
  modalDayData: null, // day object from weekData
  // draft edits for modal
  draft: {
    locA: null,
    locB: null,
    dropoffUserId: null,
    dropoffTime: '08:00',
    pickupUserId: null,
    pickupTime: '15:00',
  }
};

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, isError = false) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.toggle('error', isError);
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  // Load saved identity
  const savedId = parseInt(localStorage.getItem('kinder_user_id') || '0', 10);
  state.activeUserId = savedId || null;

  // Load current week
  const now = new Date();
  const { year, week } = getISOWeek(now);
  state.year = year;
  state.week = week;

  // Fetch users
  try {
    state.users = await apiGet('/api/users');
  } catch (e) {
    showError('Could not load users: ' + e.message);
    return;
  }

  renderIdentityBar();
  setupEventListeners();
  await loadWeek();
}

// ── Render identity bar ───────────────────────────────────────────────────────
function renderIdentityBar() {
  const [userA, userB] = state.users;
  const btnA = document.getElementById('iam-a');
  const btnB = document.getElementById('iam-b');
  if (userA) { btnA.textContent = userA.name; btnA.dataset.userid = userA.id; }
  if (userB) { btnB.textContent = userB.name; btnB.dataset.userid = userB.id; }

  btnA.classList.toggle('active', state.activeUserId === (userA && userA.id));
  btnB.classList.toggle('active', state.activeUserId === (userB && userB.id));
}

// ── Load week data ────────────────────────────────────────────────────────────
async function loadWeek() {
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('week-grid').classList.add('hidden');
  document.getElementById('error').classList.add('hidden');
  document.getElementById('week-label').textContent = formatWeekLabel(state.year, state.week);

  try {
    state.weekData = await apiGet(`/api/weeks/${state.year}/${state.week}`);
    renderGrid();
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('week-grid').classList.remove('hidden');
  } catch (e) {
    document.getElementById('loading').classList.add('hidden');
    showError('Could not load week: ' + e.message);
  }
}

function showError(msg) {
  const el = document.getElementById('error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ── Render grid ───────────────────────────────────────────────────────────────
function renderGrid() {
  const { days } = state.weekData;
  const [userA, userB] = state.users;

  // Update row labels with current names
  document.getElementById('label-a').textContent = userA ? userA.name : 'Person A';
  document.getElementById('label-b').textContent = userB ? userB.name : 'Person B';

  const headers = document.querySelectorAll('#week-grid thead th.day-col');

  days.forEach((day, col) => {
    const mon = weekToMonday(state.year, state.week);
    const d = new Date(mon);
    d.setUTCDate(mon.getUTCDate() + col);
    const dateNum = d.getUTCDate();

    // Header
    const th = headers[col];
    th.innerHTML = `${WEEKDAY_SHORT[col]}<span class="date-num">${dateNum}</span>`;
    th.classList.toggle('has-conflict', day.conflicts.length > 0);

    const userAData = day.users.find(u => userA && u.user_id === userA.id);
    const userBData = day.users.find(u => userB && u.user_id === userB.id);

    // Row A — work location
    const cellA = document.querySelector(`tr#row-a td[data-col="${col}"]`);
    cellA.innerHTML = renderLocCell(userAData);

    // Row B — work location
    const cellB = document.querySelector(`tr#row-b td[data-col="${col}"]`);
    cellB.innerHTML = renderLocCell(userBData);

    // Drop-off
    const cellDrop = document.querySelector(`tr#row-dropoff td[data-col="${col}"]`);
    const dropConflict = day.conflicts.some(c => c.includes('dropoff'));
    cellDrop.classList.toggle('has-conflict', dropConflict);
    cellDrop.innerHTML = renderEventCell('dropoff', day, userA, userB, dropConflict);

    // Pick-up
    const cellPick = document.querySelector(`tr#row-pickup td[data-col="${col}"]`);
    const pickConflict = day.conflicts.some(c => c.includes('pickup'));
    cellPick.classList.toggle('has-conflict', pickConflict);
    cellPick.innerHTML = renderEventCell('pickup', day, userA, userB, pickConflict);
  });
}

function renderLocCell(userData) {
  if (!userData) return '–';
  const loc = userData.work_location || 'home';
  const icon = loc === 'office' ? '🏢' : '🏠';
  const label = loc === 'office' ? 'Office' : 'Home';
  return `<div class="work-loc"><span>${icon}</span><span class="work-loc-text">${label}</span></div>`;
}

function renderEventCell(type, day, userA, userB) {
  const assigned = day.users.filter(u => u[`${type}_assigned`]);
  if (assigned.length === 0) {
    return `<span class="conflict-icon" title="Nobody assigned">⚠️</span>`;
  }
  if (assigned.length > 1) {
    return `<span class="conflict-icon" title="Both assigned">⚠️</span>`;
  }
  const u = assigned[0];
  const isA = userA && u.user_id === userA.id;
  const cls = isA ? 'user-a' : 'user-b';
  const initials = u.name ? u.name.slice(0, 2) : '?';
  const time = u[`${type}_time`] || '';
  return `<span class="assign-tag ${cls}">${initials}</span><span class="event-time">${time}</span>`;
}

// ── Event listeners ───────────────────────────────────────────────────────────
function setupEventListeners() {
  // Identity buttons
  document.getElementById('iam-a').addEventListener('click', () => selectUser(state.users[0]?.id));
  document.getElementById('iam-b').addEventListener('click', () => selectUser(state.users[1]?.id));

  // Week nav
  document.getElementById('prev-week').addEventListener('click', () => navigateWeek(-1));
  document.getElementById('next-week').addEventListener('click', () => navigateWeek(1));

  // Click on day column header → open modal
  document.querySelectorAll('#week-grid thead th.day-col').forEach(th => {
    th.addEventListener('click', () => openDayModal(parseInt(th.dataset.col)));
  });

  // Click on any day cell → open modal for that column
  document.querySelectorAll('#week-grid td.day-cell').forEach(td => {
    td.addEventListener('click', () => openDayModal(parseInt(td.dataset.col)));
  });

  // Day modal controls
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.querySelector('#day-modal .modal-backdrop').addEventListener('click', closeModal);

  // Location toggles
  setupToggleGroup('loc-toggle-a', val => { state.draft.locA = val; });
  setupToggleGroup('loc-toggle-b', val => { state.draft.locB = val; });

  // Assign buttons
  setupAssignGroup('dropoff-assign', uid => { state.draft.dropoffUserId = uid; });
  setupAssignGroup('pickup-assign', uid => { state.draft.pickupUserId = uid; });

  // Time inputs
  document.getElementById('dropoff-time').addEventListener('change', e => {
    state.draft.dropoffTime = e.target.value;
  });
  document.getElementById('pickup-time').addEventListener('change', e => {
    state.draft.pickupTime = e.target.value;
  });

  // Save
  document.getElementById('modal-save').addEventListener('click', saveDayModal);

  // Settings
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('settings-close').addEventListener('click', closeSettings);
  document.querySelector('#settings-modal .modal-backdrop').addEventListener('click', closeSettings);
  document.getElementById('settings-save').addEventListener('click', saveSettings);
}

function selectUser(id) {
  state.activeUserId = id;
  if (id) localStorage.setItem('kinder_user_id', id);
  else localStorage.removeItem('kinder_user_id');
  renderIdentityBar();
}

function navigateWeek(delta) {
  const { year, week } = addWeeks(state.year, state.week, delta);
  state.year = year;
  state.week = week;
  loadWeek();
}

// ── Toggle + Assign helpers ───────────────────────────────────────────────────
function setupToggleGroup(groupId, onChange) {
  const group = document.getElementById(groupId);
  group.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(btn.dataset.value);
    });
  });
}

function setupAssignGroup(groupId, onChange) {
  const group = document.getElementById(groupId);
  group.querySelectorAll('.assign-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.assign-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const uid = parseInt(btn.dataset.userid, 10);
      onChange(uid === 0 ? null : uid);
    });
  });
}

function setToggleActive(groupId, value) {
  const group = document.getElementById(groupId);
  group.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === value);
  });
}

function setAssignActive(groupId, userId) {
  const group = document.getElementById(groupId);
  group.querySelectorAll('.assign-btn').forEach(btn => {
    const btnUid = parseInt(btn.dataset.userid, 10);
    if (userId === null) {
      btn.classList.toggle('active', btnUid === 0);
    } else {
      btn.classList.toggle('active', btnUid === userId);
    }
  });
}

// ── Day modal ─────────────────────────────────────────────────────────────────
function openDayModal(col) {
  if (!state.weekData) return;
  const day = state.weekData.days[col];
  state.modalDate = day.date;
  state.modalDayData = day;

  const [userA, userB] = state.users;

  // Update button labels with real names
  document.getElementById('modal-name-a').textContent = userA?.name || 'Person A';
  document.getElementById('modal-name-b').textContent = userB?.name || 'Person B';
  document.getElementById('dropoff-btn-a').textContent = userA?.name || 'Person A';
  document.getElementById('dropoff-btn-b').textContent = userB?.name || 'Person B';
  document.getElementById('pickup-btn-a').textContent = userA?.name || 'Person A';
  document.getElementById('pickup-btn-b').textContent = userB?.name || 'Person B';

  // Format title
  const mon = weekToMonday(state.year, state.week);
  const d = new Date(mon);
  d.setUTCDate(mon.getUTCDate() + col);
  const weekdayFull = ['Monday','Tuesday','Wednesday','Thursday','Friday'][col];
  document.getElementById('modal-title').textContent =
    `${weekdayFull}, ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}`;

  // Populate draft from current data
  const uAData = userA ? day.users.find(u => u.user_id === userA.id) : null;
  const uBData = userB ? day.users.find(u => u.user_id === userB.id) : null;

  state.draft.locA = uAData?.work_location || 'home';
  state.draft.locB = uBData?.work_location || 'home';
  setToggleActive('loc-toggle-a', state.draft.locA);
  setToggleActive('loc-toggle-b', state.draft.locB);

  // Determine who has dropoff/pickup assigned
  const dropoffUser = day.users.find(u => u.dropoff_assigned);
  const pickupUser = day.users.find(u => u.pickup_assigned);

  state.draft.dropoffUserId = dropoffUser?.user_id ?? null;
  state.draft.dropoffTime = dropoffUser?.dropoff_time || uAData?.dropoff_time || '08:00';
  state.draft.pickupUserId = pickupUser?.user_id ?? null;
  state.draft.pickupTime = pickupUser?.pickup_time || uAData?.pickup_time || '15:00';

  setAssignActive('dropoff-assign', state.draft.dropoffUserId);
  setAssignActive('pickup-assign', state.draft.pickupUserId);
  document.getElementById('dropoff-time').value = state.draft.dropoffTime || '08:00';
  document.getElementById('pickup-time').value = state.draft.pickupTime || '15:00';

  document.getElementById('day-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('day-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

async function saveDayModal() {
  const saveBtn = document.getElementById('modal-save');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  const date = state.modalDate;
  const [userA, userB] = state.users;
  const { draft } = state;

  try {
    // Save user A
    if (userA) {
      const dropoffA = draft.dropoffUserId === userA.id;
      const pickupA = draft.pickupUserId === userA.id;
      await apiPut(`/api/days/${date}/user/${userA.id}`, {
        work_location: draft.locA || 'home',
        dropoff_assigned: dropoffA,
        dropoff_time: dropoffA ? (draft.dropoffTime || '08:00') : null,
        pickup_assigned: pickupA,
        pickup_time: pickupA ? (draft.pickupTime || '15:00') : null,
      });
    }
    // Save user B
    if (userB) {
      const dropoffB = draft.dropoffUserId === userB.id;
      const pickupB = draft.pickupUserId === userB.id;
      await apiPut(`/api/days/${date}/user/${userB.id}`, {
        work_location: draft.locB || 'home',
        dropoff_assigned: dropoffB,
        dropoff_time: dropoffB ? (draft.dropoffTime || '08:00') : null,
        pickup_assigned: pickupB,
        pickup_time: pickupB ? (draft.pickupTime || '15:00') : null,
      });
    }

    showToast('Saved ✓');
    closeModal();
    await loadWeek();
  } catch (e) {
    showToast(e.message, true);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save';
  }
}

// ── Settings modal ────────────────────────────────────────────────────────────
function openSettings() {
  const [userA, userB] = state.users;
  document.getElementById('name-input-a').value = userA?.name || '';
  document.getElementById('name-input-b').value = userB?.name || '';
  document.getElementById('settings-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeSettings() {
  document.getElementById('settings-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

async function saveSettings() {
  const btn = document.getElementById('settings-save');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  const nameA = document.getElementById('name-input-a').value.trim();
  const nameB = document.getElementById('name-input-b').value.trim();
  const [userA, userB] = state.users;

  try {
    if (userA && nameA && nameA !== userA.name) {
      const updated = await apiPut(`/api/users/${userA.id}`, { name: nameA });
      state.users[0] = updated;
    }
    if (userB && nameB && nameB !== userB.name) {
      const updated = await apiPut(`/api/users/${userB.id}`, { name: nameB });
      state.users[1] = updated;
    }
    renderIdentityBar();
    renderGrid();
    showToast('Names saved ✓');
    closeSettings();
  } catch (e) {
    showToast(e.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Names';
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
init();
