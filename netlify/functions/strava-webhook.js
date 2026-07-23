const { db } = require('./_firebase');
const { getValidAccessToken, fetchActivity } = require('./_strava');
const { activityDateToRunId } = require('./_plan');

function fmtPace(secPerMile) {
  if (!isFinite(secPerMile) || secPerMile <= 0) return '';
  const m = Math.floor(secPerMile / 60);
  const s = Math.round(secPerMile % 60);
  return m + ':' + String(s).padStart(2, '0');
}

exports.handler = async (event) => {
  // Strava's one-time subscription validation handshake.
  if (event.httpMethod === 'GET') {
    const q = event.queryStringParameters || {};
    if (q['hub.mode'] === 'subscribe' && q['hub.verify_token'] === process.env.STRAVA_VERIFY_TOKEN) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'hub.challenge': q['hub.challenge'] })
      };
    }
    return { statusCode: 403, body: 'forbidden' };
  }

  if (event.httpMethod === 'POST') {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (e) {}

    try {
      if (body.object_type === 'activity' && body.aspect_type === 'create') {
        const token = await getValidAccessToken(db);
        const act = await fetchActivity(token, body.object_id);
        const kind = (act.sport_type || act.type || '');

        if (/run/i.test(kind)) {
          const dateStr = (act.start_date_local || '').slice(0, 10);
          const runId = activityDateToRunId(dateStr);

          if (runId) {
            const splits = {};
            if (Array.isArray(act.splits_standard)) {
              act.splits_standard.forEach((s, i) => {
                const miles = s.distance / 1609.34;
                if (miles > 0) splits[i] = fmtPace(s.moving_time / miles);
              });
            }
            const miles = act.distance / 1609.34;
            const avg = act.moving_time / miles;

            // Write only run-status fields; we leave the user's own `note` untouched.
            await db.collection('log').doc(runId).set({
              done: true,
              splits,
              strava: {
                id: act.id,
                name: act.name || '',
                miles: Number(miles.toFixed(2)),
                avgPace: fmtPace(avg),
                syncedAt: Date.now()
              }
            }, { merge: true });
          }
        }
      }
    } catch (e) {
      console.error('webhook processing error:', e);
    }

    // Always 200 so Strava doesn't retry/disable the subscription.
    return { statusCode: 200, body: 'ok' };
  }

  return { statusCode: 405, body: 'method not allowed' };
};
