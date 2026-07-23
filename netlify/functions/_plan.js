// Sub-10 revision. Week 1 Monday = Jun 29, 2026 (UNCHANGED — this is what keeps
// already-logged runs matching). Run ids are 'w{week}r{index}', where index is
// the position within THAT week's run list. Run days now vary by week: the 5th
// day (Saturday) comes in at week 5, and race week drops Wednesday.
const START = Date.UTC(2026, 5, 29);
const DAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const RUN_DAYS = [
  ['MON', 'TUE', 'WED', 'FRI'],                  // wk 1   \
  ['MON', 'TUE', 'WED', 'FRI'],                  // wk 2    | unchanged —
  ['MON', 'TUE', 'WED', 'FRI'],                  // wk 3    | protects logged data
  ['MON', 'TUE', 'WED', 'FRI'],                  // wk 4   /
  ['MON', 'TUE', 'WED', 'FRI', 'SAT'],           // wk 5  (5th day in)
  ['MON', 'TUE', 'WED', 'FRI', 'SAT'],           // wk 6
  ['MON', 'TUE', 'WED', 'FRI', 'SAT'],           // wk 7
  ['MON', 'TUE', 'WED', 'FRI', 'SAT'],           // wk 8  (cutback)
  ['MON', 'TUE', 'WED', 'FRI', 'SAT'],           // wk 9
  ['MON', 'TUE', 'WED', 'FRI', 'SAT'],           // wk 10
  ['MON', 'TUE', 'WED', 'FRI', 'SAT'],           // wk 11 (peak / race sim)
  ['MON', 'TUE', 'WED', 'FRI', 'SAT'],           // wk 12 (taper)
  ['MON', 'TUE', 'FRI', 'SAT']                   // wk 13 (race week; SAT = RACE)
];

// localDateStr: 'YYYY-MM-DD' (from Strava start_date_local). Returns runId or null.
function activityDateToRunId(localDateStr) {
  const [y, m, d] = (localDateStr || '').split('-').map(Number);
  if (!y) return null;
  const t = Date.UTC(y, m - 1, d);
  const diffDays = Math.floor((t - START) / 86400000);
  if (diffDays < 0) return null;
  const weekN = Math.floor(diffDays / 7) + 1;
  if (weekN < 1 || weekN > RUN_DAYS.length) return null;
  const day = DAY[new Date(t).getUTCDay()];
  const idx = RUN_DAYS[weekN - 1].indexOf(day);
  if (idx === -1) return null; // rest day, or a run day this week doesn't have
  return 'w' + weekN + 'r' + idx;
}

module.exports = { activityDateToRunId };
