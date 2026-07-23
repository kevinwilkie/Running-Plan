// One-time: register the Strava webhook so new activities push to your site.
// Run AFTER your site is deployed:  node scripts/subscribe.js
const id = process.env.STRAVA_CLIENT_ID;
const secret = process.env.STRAVA_CLIENT_SECRET;
const verify = process.env.STRAVA_VERIFY_TOKEN;
const app = process.env.APP_URL;
const callback = `${app}/.netlify/functions/strava-webhook`;

const body = new URLSearchParams({
  client_id: id, client_secret: secret, callback_url: callback, verify_token: verify
});

fetch('https://www.strava.com/api/v3/push_subscriptions', { method: 'POST', body })
  .then(r => r.json())
  .then(d => console.log('Subscription result:', d))
  .catch(e => console.error(e));
