const STORAGE_KEY = 'habit_pulse_data_v1';

/**
 * Generates an array of the last 7 days ending today.
 * Returns objects with ISO date string (YYYY-MM-DD), short weekday, and day number.
 */
export function getLast7Days() {
  const days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const iso = `${yyyy}-${mm}-${dd}`;

    days.push({
      iso,
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: i === 0
    });
  }
  return days;
}

/**
 * Seeds default demo habits so the dashboard looks rich on first load.
 */
function createDefaultHabits() {
  const week = getLast7Days();
  return [
    {
      id: 'h-1',
      name: 'Morning Hydration (500ml)',
      color: '#10b981',
      logs: {
        [week[0].iso]: true,
        [week[1].iso]: true,
        [week[2].iso]: true,
        [week[3].iso]: true,
        [week[4].iso]: true,
        [week[5].iso]: true,
        [week[6].iso]: true
      }
    },
    {
      id: 'h-2',
      name: 'Read 20 Pages',
      color: '#f59e0b',
      logs: {
        [week[0].iso]: true,
        [week[1].iso]: false,
        [week[2].iso]: true,
        [week[3].iso]: true,
        [week[4].iso]: true,
        [week[5].iso]: true,
        [week[6].iso]: false
      }
    },
    {
      id: 'h-3',
      name: '30m Focused Coding / Deep Work',
      color: '#ec4899',
      logs: {
        [week[0].iso]: false,
        [week[1].iso]: true,
        [week[2].iso]: true,
        [week[3].iso]: false,
        [week[4].iso]: true,
        [week[5].iso]: true,
        [week[6].iso]: true
      }
    },
    {
      id: 'h-4',
      name: '10m Mindfulness Meditation',
      color: '#6366f1',
      logs: {
        [week[0].iso]: true,
        [week[1].iso]: true,
        [week[2].iso]: false,
        [week[3].iso]: true,
        [week[4].iso]: false,
        [week[5].iso]: true,
        [week[6].iso]: false
      }
    }
  ];
}

export function loadHabits() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const defaults = createDefaultHabits();
    saveHabits(defaults);
    return defaults;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return createDefaultHabits();
  }
}

export function saveHabits(habits) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

export function resetToDemoData() {
  const defaults = createDefaultHabits();
  saveHabits(defaults);
  return defaults;
}

/**
 * Calculates consecutive active streak ending today (or yesterday if today isn't checked yet).
 */
export function calculateStreak(habit, weekDays) {
  let streak = 0;
  // Walk backwards from today
  for (let i = weekDays.length - 1; i >= 0; i--) {
    const iso = weekDays[i].iso;
    if (habit.logs && habit.logs[iso]) {
      streak++;
    } else {
      // If today isn't checked yet, allow yesterday's streak to still count
      if (i === weekDays.length - 1) continue;
      break;
    }
  }
  return streak;
}
