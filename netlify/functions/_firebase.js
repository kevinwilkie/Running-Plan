const admin = require('firebase-admin');

if (!admin.apps.length) {
  const sa = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8')
  );
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const db = admin.firestore();
module.exports = { admin, db };
