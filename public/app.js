/* ── Kinder Planner — app.js ── */

// ── ISO week helpers ──────────────────────────────────────────────────────────
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return {
    week: Math.ceil((((d - yearStart) / 86400000) + 1) / 7),
    year: d.getUTCFullYear()
  };
}

function addWeeks(year, week, delta) {
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

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(path, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `DELETE ${path} failed: ${res.status}`);
  }
  return res.json().catch(() => ({}));
}

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  users: [],          // [{id, name, type}, ...] type: 'primary' | 'occasional'
  activeUserId: null,
  year: null,
  week: null,
  weekData: null,
  modalDate: null,
  modalDayData: null,
  draft: {
    locA: null,
    locB: null,
    dropoffUserId: null,
    dropoffTime: '08:00',
    pickupUserId: null,
    pickupTime: '15:00',
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function primaryUsers() {
  return state.users.filter(u => u.type === 'primary' || !u.type);
}

function occasionalUsers() {
  return state.users.filter(u => u.type === 'occasional');
}

function allUsers() {
  return state.users;
}

function userById(id) {
  return state.users.find(u => u.id === id) || null;
}

// Color class for a user: primary users get user-a / user-b, occasional get user-occ
function userColorClass(userId) {
  const primaries = primaryUsers();
  const idx = primaries.findIndex(u => u.id === userId);
  if (idx === 0) return 'user-a';
  if (idx === 1) return 'user-b';
  return 'user-occ';
}

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
  const savedId = parseInt(localStorage.getItem('kinder_user_id') || '0', 10);
  state.activeUserId = savedId || null;

  const now = new Date();
  const { year, week } = getISOWeek(now);
  state.year = year;
  state.week = week;

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
  const primaries = primaryUsers();
  const [userA, userB] = primaries;
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
  const primaries = primaryUsers();
  const [userA, userB] = primaries;

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
    th.classList.toggle('has-conflict', (day.conflicts || []).length > 0);

    // work_locations array from new API shape
    const workLocs = day.work_locations || [];
    const userALoc = workLocs.find(u => userA && u.user_id === userA.id);
    const userBLoc = workLocs.find(u => userB && u.user_id === userB.id);

    // Row A — work location
    const cellA = document.querySelector(`tr#row-a td[data-col="${col}"]`);
    cellA.innerHTML = renderLocCell(userALoc);

    // Row B — work location
    const cellB = document.querySelector(`tr#row-b td[data-col="${col}"]`);
    cellB.innerHTML = renderLocCell(userBLoc);

    // Drop-off
    const cellDrop = document.querySelector(`tr#row-dropoff td[data-col="${col}"]`);
    const dropConflict = (day.conflicts || []).some(c => c.includes('dropoff'));
    cellDrop.classList.toggle('has-conflict', dropConflict);
    cellDrop.innerHTML = renderEventCell(day.dropoff, dropConflict);

    // Pick-up
    const cellPick = document.querySelector(`tr#row-pickup td[data-col="${col}"]`);
    const pickConflict = (day.conflicts || []).some(c => c.includes('pickup'));
    cellPick.classList.toggle('has-conflict', pickConflict);
    cellPick.innerHTML = renderEventCell(day.pickup, pickConflict);
  });
}

function renderLocCell(locData) {
  if (!locData) return '–';
  const loc = locData.work_location || 'home';
  const icon = loc === 'office' ? '🏢' : '🏠';
  const label = loc === 'office' ? 'Office' : 'Home';
  return `<div class="work-loc"><span>${icon}</span><span class="work-loc-text">${label}</span></div>`;
}

// assignment: { user_id, name, time } or null
function renderEventCell(assignment, isConflict) {
  if (!assignment) {
    return `<span class="conflict-icon" title="Nobody assigned">⚠️</span>`;
  }
  const cls = userColorClass(assignment.user_id);
  const initials = assignment.name ? assignment.name.slice(0, 2) : '?';
  const time = assignment.time || '';
  return `<span class="assign-tag ${cls}" title="${assignment.name}">${initials}</span><span class="event-time">${time}</span>`;
}

// ── Event listeners ───────────────────────────────────────────────────────────
function setupEventListeners() {
  const primaries = primaryUsers();

  document.getElementById('iam-a').addEventListener('click', () => selectUser(primaries[0]?.id));
  document.getElementById('iam-b').addEventListener('click', () => selectUser(primaries[1]?.id));

  document.getElementById('prev-week').addEventListener('click', () => navigateWeek(-1));
  document.getElementById('next-week').addEventListener('click', () => navigateWeek(1));

  document.querySelectorAll('#week-grid thead th.day-col').forEach(th => {
    th.addEventListener('click', () => openDayModal(parseInt(th.dataset.col)));
  });

  document.querySelectorAll('#week-grid td.day-cell').forEach(td => {
    td.addEventListener('click', () => openDayModal(parseInt(td.dataset.col)));
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.querySelector('#day-modal .modal-backdrop').addEventListener('click', closeModal);

  setupToggleGroup('loc-toggle-a', val => { state.draft.locA = val; });
  setupToggleGroup('loc-toggle-b', val => { state.draft.locB = val; });

  document.getElementById('dropoff-time').addEventListener('change', e => {
    state.draft.dropoffTime = e.target.value;
  });
  document.getElementById('pickup-time').addEventListener('change', e => {
    state.draft.pickupTime = e.target.value;
  });

  document.getElementById('modal-save').addEventListener('click', saveDayModal);

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

// ── Toggle helpers ────────────────────────────────────────────────────────────
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

function setToggleActive(groupId, value) {
  const group = document.getElementById(groupId);
  group.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === value);
  });
}

// ── Dynamic assign buttons (built at modal open time) ────────────────────────
function buildAssignButtons(containerId, selectedUserId, onSelect) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  // "Nobody" button
  const nobodyBtn = document.createElement('button');
  nobodyBtn.className = 'assign-btn assign-btn--nobody';
  nobodyBtn.textContent = 'Nobody';
  nobodyBtn.dataset.userid = '0';
  nobodyBtn.addEventListener('click', () => {
    container.querySelectorAll('.assign-btn').forEach(b => b.classList.remove('active'));
    nobodyBtn.classList.add('active');
    onSelect(null);
  });
  if (selectedUserId === null) nobodyBtn.classList.add('active');
  container.appendChild(nobodyBtn);

  // Primary users first
  primaryUsers().forEach(u => {
    const btn = document.createElement('button');
    btn.className = `assign-btn assign-btn--${userColorClass(u.id)}`;
    btn.textContent = u.name;
    btn.dataset.userid = String(u.id);
    btn.addEventListener('click', () => {
      container.querySelectorAll('.assign-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onSelect(u.id);
    });
    if (selectedUserId === u.id) btn.classList.add('active');
    container.appendChild(btn);
  });

  // Occasional users
  const occs = occasionalUsers();
  if (occs.length > 0) {
    const sep = document.createElement('span');
    sep.className = 'assign-sep';
    sep.textContent = '·';
    container.appendChild(sep);

    occs.forEach(u => {
      const btn = document.createElement('button');
      btn.className = 'assign-btn assign-btn--occ';
      btn.textContent = u.name;
      btn.dataset.userid = String(u.id);
      btn.addEventListener('click', () => {
        container.querySelectorAll('.assign-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        onSelect(u.id);
      });
      if (selectedUserId === u.id) btn.classList.add('active');
      container.appendChild(btn);
    });
  }
}

// ── Day modal ─────────────────────────────────────────────────────────────────
function openDayModal(col) {
  if (!state.weekData) return;
  const day = state.weekData.days[col];
  state.modalDate = day.date;
  state.modalDayData = day;

  const primaries = primaryUsers();
  const [userA, userB] = primaries;

  // Update primary user name labels in Work Location section
  document.getElementById('modal-name-a').textContent = userA?.name || 'Person A';
  document.getElementById('modal-name-b').textContent = userB?.name || 'Person B';

  // Format title
  const mon = weekToMonday(state.year, state.week);
  const d = new Date(mon);
  d.setUTCDate(mon.getUTCDate() + col);
  const weekdayFull = ['Monday','Tuesday','Wednesday','Thursday','Friday'][col];
  document.getElementById('modal-title').textContent =
    `${weekdayFull}, ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}`;

  // Populate work location draft from work_locations array
  const workLocs = day.work_locations || [];
  const uALoc = userA ? workLocs.find(u => u.user_id === userA.id) : null;
  const uBLoc = userB ? workLocs.find(u => u.user_id === userB.id) : null;

  state.draft.locA = uALoc?.work_location || 'home';
  state.draft.locB = uBLoc?.work_location || 'home';
  setToggleActive('loc-toggle-a', state.draft.locA);
  setToggleActive('loc-toggle-b', state.draft.locB);

  // New API: dropoff / pickup are single objects {user_id, name, time} or null
  const dropoff = day.dropoff || null;
  const pickup = day.pickup || null;

  state.draft.dropoffUserId = dropoff?.user_id ?? null;
  state.draft.dropoffTime = dropoff?.time || '08:00';
  state.draft.pickupUserId = pickup?.user_id ?? null;
  state.draft.pickupTime = pickup?.time || '15:00';

  // Build dynamic assign buttons
  buildAssignButtons('dropoff-assign', state.draft.dropoffUserId, uid => {
    state.draft.dropoffUserId = uid;
  });
  buildAssignButtons('pickup-assign', state.draft.pickupUserId, uid => {
    state.draft.pickupUserId = uid;
  });

  document.getElementById('dropoff-time').value = state.draft.dropoffTime;
  document.getElementById('pickup-time').value = state.draft.pickupTime;

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
  const primaries = primaryUsers();
  const [userA, userB] = primaries;
  const { draft } = state;

  try {
    // Save WFH for primary users
    if (userA) {
      await apiPut(`/api/days/${date}/user/${userA.id}`, {
        work_location: draft.locA || 'home',
      });
    }
    if (userB) {
      await apiPut(`/api/days/${date}/user/${userB.id}`, {
        work_location: draft.locB || 'home',
      });
    }

    // Save drop-off / pick-up via new assignments endpoint
    await apiPut(`/api/assignments/${date}`, {
      dropoff_user_id: draft.dropoffUserId ?? null,
      dropoff_time: draft.dropoffUserId ? (draft.dropoffTime || '08:00') : null,
      pickup_user_id: draft.pickupUserId ?? null,
      pickup_time: draft.pickupUserId ? (draft.pickupTime || '15:00') : null,
    });

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
  const primaries = primaryUsers();
  const [userA, userB] = primaries;
  document.getElementById('name-input-a').value = userA?.name || '';
  document.getElementById('name-input-b').value = userB?.name || '';

  renderOccasionalList();

  document.getElementById('settings-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeSettings() {
  document.getElementById('settings-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function renderOccasionalList() {
  const list = document.getElementById('occasional-list');
  list.innerHTML = '';
  const occs = occasionalUsers();
  if (occs.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'occ-empty';
    empty.textContent = 'No occasional people yet.';
    list.appendChild(empty);
    return;
  }
  occs.forEach(u => {
    const row = document.createElement('div');
    row.className = 'occ-row';
    row.innerHTML = `
      <span class="occ-name">${escapeHtml(u.name)}</span>
      <button class="occ-delete icon-btn" aria-label="Remove ${escapeHtml(u.name)}" data-userid="${u.id}">×</button>
    `;
    row.querySelector('.occ-delete').addEventListener('click', () => deleteOccasional(u.id));
    list.appendChild(row);
  });
}

async function deleteOccasional(userId) {
  try {
    await apiDelete(`/api/users/${userId}`);
    state.users = state.users.filter(u => u.id !== userId);
    renderOccasionalList();
    showToast('Removed ✓');
  } catch (e) {
    showToast(e.message, true);
  }
}

async function addOccasional() {
  const input = document.getElementById('occ-name-input');
  const name = input.value.trim();
  if (!name) return;

  const btn = document.getElementById('occ-add-btn');
  btn.disabled = true;

  try {
    const newUser = await apiPost('/api/users', { name, type: 'occasional' });
    state.users.push(newUser);
    input.value = '';
    renderOccasionalList();
    showToast(`${name} added ✓`);
  } catch (e) {
    showToast(e.message, true);
  } finally {
    btn.disabled = false;
  }
}

async function saveSettings() {
  const btn = document.getElementById('settings-save');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  const nameA = document.getElementById('name-input-a').value.trim();
  const nameB = document.getElementById('name-input-b').value.trim();
  const primaries = primaryUsers();
  const [userA, userB] = primaries;

  try {
    if (userA && nameA && nameA !== userA.name) {
      const updated = await apiPut(`/api/users/${userA.id}`, { name: nameA });
      const idx = state.users.findIndex(u => u.id === userA.id);
      if (idx !== -1) state.users[idx] = updated;
    }
    if (userB && nameB && nameB !== userB.name) {
      const updated = await apiPut(`/api/users/${userB.id}`, { name: nameB });
      const idx = state.users.findIndex(u => u.id === userB.id);
      if (idx !== -1) state.users[idx] = updated;
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

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Boot ──────────────────────────────────────────────────────────────────────
init();
