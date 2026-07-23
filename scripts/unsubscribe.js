// Usage: node scripts/unsubscribe.js <subscription_id>
const id = process.env.STRAVA_CLIENT_ID, secret = process.env.STRAVA_CLIENT_SECRET;
const subId = process.argv[2];
if (!subId) { console.error('Pass the subscription id (see npm run view-sub)'); process.exit(1); }
fetch(`https://www.strava.com/api/v3/push_subscriptions/${subId}?client_id=${id}&client_secret=${secret}`, { method: 'DELETE' })
  .then(r => console.log('Deleted, status', r.status)).catch(e => console.error(e));
