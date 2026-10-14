import {
  getLast7Days,
  loadHabits,
  saveHabits,
  resetToDemoData,
  calculateStreak
} from './storage.js';
import { renderCharts } from './chart.js';

let habits = [];
const weekDays = getLast7Days();

document.addEventListener('DOMContentLoaded', () => {
  habits = loadHabits();
  initDateBanner();
  renderTableHeader();
  refreshDashboard();
  setupEventListeners();
});

function initDateBanner() {
  const badge = document.getElementById('current-date-display');
  const now = new Date();
  badge.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
}

function renderTableHeader() {
  const headerRow = document.getElementById('habit-table-header');
  const dayHeadersHtml = weekDays
    .map(
      (d) => `
      <th class="day-col-header ${d.isToday ? 'is-today' : ''}">
        <div>${d.weekday}</div>
        <div>${d.dayNum}</div>
      </th>
    `
    )
    .join('');

  headerRow.innerHTML = `
    <th>Habit Goal</th>
    ${dayHeadersHtml}
    <th>Streak</th>
    <th></th>
  `;
}

function refreshDashboard() {
  renderHabitRows();
  updateSummaryStats();
  renderCharts(habits, weekDays);
}

function renderHabitRows() {
  const tbody = document.getElementById('habit-table-body');
  tbody.innerHTML = '';

  if (habits.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="padding: 2rem; color: #64748b;">
          No habits tracked yet. Use the "+ Add Goal" form above to start!
        </td>
      </tr>
    `;
    return;
  }

  habits.forEach((habit) => {
    const tr = document.createElement('tr');
    const streak = calculateStreak(habit, weekDays);

    const dayCells = weekDays
      .map((day) => {
        const isDone = Boolean(habit.logs && habit.logs[day.iso]);
        return `
          <td>
            <button 
              class="check-btn ${isDone ? 'completed' : ''}" 
              data-habit-id="${habit.id}" 
              data-date="${day.iso}"
              aria-label="Toggle ${habit.name} for ${day.weekday}"
            >
              ✓
            </button>
          </td>
        `;
      })
      .join('');

    tr.innerHTML = `
      <td>
        <div class="habit-name-cell">
          <span class="color-dot" style="background-color: ${habit.color}"></span>
          <span>${escapeHtml(habit.name)}</span>
        </div>
      </td>
      ${dayCells}
      <td>
        <span class="streak-pill">🔥 ${streak}d</span>
      </td>
      <td>
        <button class="delete-btn" data-delete-id="${habit.id}" title="Delete habit">✕</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function updateSummaryStats() {
  const todayIso = weekDays[weekDays.length - 1].iso;
  const totalHabits = habits.length;

  // 1. Today's progress
  const completedToday = habits.filter((h) => h.logs && h.logs[todayIso]).length;
  const todayPct = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  document.getElementById('stat-today').textContent = `${completedToday} / ${totalHabits}`;
  document.getElementById('stat-today-pct').textContent = `${todayPct}% completed today`;

  // 2. Best Active Streak
  let bestStreak = 0;
  let bestHabitName = 'No active streaks yet';

  habits.forEach((h) => {
    const s = calculateStreak(h, weekDays);
    if (s > bestStreak) {
      bestStreak = s;
      bestHabitName = h.name;
    }
  });

  document.getElementById('stat-best-streak').textContent = `${bestStreak} days 🔥`;
  document.getElementById('stat-best-habit').textContent =
    bestStreak > 0 ? `Top: ${bestHabitName}` : 'Check off a goal today!';

  // 3. Weekly Completion Rate
  const totalPossible = totalHabits * 7;
  let totalCompletedWeek = 0;

  habits.forEach((h) => {
    weekDays.forEach((d) => {
      if (h.logs && h.logs[d.iso]) totalCompletedWeek++;
    });
  });

  const weeklyRate = totalPossible > 0 ? Math.round((totalCompletedWeek / totalPossible) * 100) : 0;
  document.getElementById('stat-weekly-rate').textContent = `${weeklyRate}%`;
}

function setupEventListeners() {
  // Add new habit
  const form = document.getElementById('add-habit-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('habit-name-input');
    const categoryInput = document.getElementById('habit-category-input');

    const name = nameInput.value.trim();
    if (!name) return;

    habits.push({
      id: 'h-' + Date.now(),
      name,
      color: categoryInput.value,
      logs: {}
    });

    saveHabits(habits);
    nameInput.value = '';
    refreshDashboard();
  });

  // Event delegation for habit check-ins and delete buttons
  const tbody = document.getElementById('habit-table-body');
  tbody.addEventListener('click', (e) => {
    const checkBtn = e.target.closest('.check-btn');
    if (checkBtn) {
      const { habitId, date } = checkBtn.dataset;
      const habit = habits.find((h) => h.id === habitId);
      if (habit) {
        habit.logs = habit.logs || {};
        habit.logs[date] = !habit.logs[date];
        saveHabits(habits);
        refreshDashboard();
      }
      return;
    }

    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      const { deleteId } = deleteBtn.dataset;
      habits = habits.filter((h) => h.id !== deleteId);
      saveHabits(habits);
      refreshDashboard();
    }
  });

  // Reset Demo Data
  document.getElementById('reset-demo-btn').addEventListener('click', () => {
    habits = resetToDemoData();
    refreshDashboard();
  });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (char) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return map[char];
  });
}
