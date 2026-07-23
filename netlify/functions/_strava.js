const TOKEN_URL = 'https://www.strava.com/oauth/token';

// Returns a valid (refreshed if needed) access token, persisting any refresh.
async function getValidAccessToken(db) {
  const ref = db.collection('strava').doc('tokens');
  const snap = await ref.get();
  if (!snap.exists) throw new Error('No Strava tokens stored — connect Strava first.');

  const t = snap.data();
  const now = Math.floor(Date.now() / 1000);
  if (t.expires_at && now < t.expires_at - 60) return t.access_token;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: t.refresh_token
    })
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Token refresh failed: ' + JSON.stringify(data));

  await ref.set({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at
  }, { merge: true });

  return data.access_token;
}

async function fetchActivity(token, id) {
  const res = await fetch(`https://www.strava.com/api/v3/activities/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Activity fetch failed: ' + res.status);
  return res.json();
}

module.exports = { getValidAccessToken, fetchActivity };
