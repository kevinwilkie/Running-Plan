// Week 1 Monday = Jun 29, 2026. Run ids must match the frontend: 'w{week}r{index}'.
const START = Date.UTC(2026, 5, 29);
const DAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Which days hold a *run* each week, in the same order the frontend lists them.
const RUN_DAYS = Array.from({ length: 13 }, (_, i) =>
  i === 12 ? ['MON', 'TUE', 'FRI', 'SAT']   // race week: Mon, Tue, Fri shakeout, Sat RACE
           : ['MON', 'TUE', 'WED', 'FRI']
);

// localDateStr: 'YYYY-MM-DD' (from Strava start_date_local). Returns a runId or null.
function activityDateToRunId(localDateStr) {
  const [y, m, d] = (localDateStr || '').split('-').map(Number);
  if (!y) return null;
  const t = Date.UTC(y, m - 1, d);
  const diffDays = Math.floor((t - START) / 86400000);
  if (diffDays < 0) return null;
  const weekN = Math.floor(diffDays / 7) + 1;
  if (weekN < 1 || weekN > 13) return null;
  const day = DAY[new Date(t).getUTCDay()];
  const idx = RUN_DAYS[weekN - 1].indexOf(day);
  if (idx === -1) return null; // not a planned run day (rest / strength day)
  return 'w' + weekN + 'r' + idx;
}

module.exports = { activityDateToRunId };
