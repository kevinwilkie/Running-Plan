const id = process.env.STRAVA_CLIENT_ID, secret = process.env.STRAVA_CLIENT_SECRET;
fetch(`https://www.strava.com/api/v3/push_subscriptions?client_id=${id}&client_secret=${secret}`)
  .then(r => r.json()).then(d => console.log(d)).catch(e => console.error(e));
