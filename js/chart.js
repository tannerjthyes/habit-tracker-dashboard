import { calculateStreak } from './storage.js';

/**
 * Renders the 7-day vertical completion bar chart and the horizontal streak breakdown.
 */
export function renderCharts(habits, weekDays) {
  renderDailyCompletionBars(habits, weekDays);
  renderHabitStreakBars(habits, weekDays);
}

function renderDailyCompletionBars(habits, weekDays) {
  const container = document.getElementById('weekly-chart-container');
  container.innerHTML = '';

  const totalHabits = habits.length;

  weekDays.forEach((day) => {
    let completedCount = 0;
    habits.forEach((habit) => {
      if (habit.logs && habit.logs[day.iso]) {
        completedCount++;
      }
    });

    const pct = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

    const col = document.createElement('div');
    col.className = 'chart-col';

    col.innerHTML = `
      <span class="bar-pct">${pct}%</span>
      <div class="bar-track" title="${completedCount}/${totalHabits} completed on ${day.weekday}">
        <div class="bar-fill ${pct === 100 ? 'perfect-day' : ''}" style="height: ${pct}%"></div>
      </div>
      <span class="bar-label ${day.isToday ? 'is-today' : ''}">
        ${day.isToday ? 'Today' : day.weekday}
      </span>
    `;

    container.appendChild(col);
  });
}

function renderHabitStreakBars(habits, weekDays) {
  const listEl = document.getElementById('habit-streak-bars');
  listEl.innerHTML = '';

  if (habits.length === 0) {
    listEl.innerHTML = `<p style="color:#64748b;font-size:0.85rem;">Add a habit to see streak analytics.</p>`;
    return;
  }

  // Sort habits by highest current streak
  const enriched = habits
    .map((h) => ({
      ...h,
      streak: calculateStreak(h, weekDays),
      weeklyTotal: weekDays.filter((d) => h.logs && h.logs[d.iso]).length
    }))
    .sort((a, b) => b.streak - a.streak);

  enriched.forEach((habit) => {
    const pct = Math.round((habit.weeklyTotal / 7) * 100);
    const row = document.createElement('div');
    row.className = 'streak-row';

    row.innerHTML = `
      <div class="streak-row-top">
        <span>${habit.name}</span>
        <span>${habit.weeklyTotal}/7 days (${habit.streak}d streak)</span>
      </div>
      <div class="streak-bar-bg">
        <div class="streak-bar-fill" style="width: ${pct}%; background-color: ${habit.color}"></div>
      </div>
    `;
    listEl.appendChild(row);
  });
}
