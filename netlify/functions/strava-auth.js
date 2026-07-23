const { db } = require('./_firebase');

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = `${process.env.APP_URL}/.netlify/functions/strava-auth`;

  // Step 1: no code yet -> send the user to Strava's consent screen.
  if (!q.code) {
    const url = 'https://www.strava.com/oauth/authorize'
      + `?client_id=${clientId}`
      + '&response_type=code'
      + `&redirect_uri=${encodeURIComponent(redirectUri)}`
      + '&approval_prompt=auto'
      + '&scope=activity:read_all';
    return { statusCode: 302, headers: { Location: url }, body: '' };
  }

  // Step 2: Strava redirected back with a code -> exchange it for tokens.
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code: q.code,
      grant_type: 'authorization_code'
    })
  });
  const data = await res.json();

  if (data.access_token) {
    await db.collection('strava').doc('tokens').set({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      athlete_id: data.athlete && data.athlete.id
    }, { merge: true });
  }

  return { statusCode: 302, headers: { Location: `${process.env.APP_URL}/?connected=1` }, body: '' };
};
