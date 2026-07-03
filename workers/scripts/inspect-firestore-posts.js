import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('../serviceAccountKey.json', 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function inspect() {
  console.log('--- Inspecting Firestore Collections ---');
  const collections = await db.listCollections();
  console.log('Collections list:', collections.map(c => c.id));

  console.log('--- Inspecting Firestore community_posts ---');
  const snapshot = await db.collection('community_posts').get();
  console.log(`Total community_posts in Firestore: ${snapshot.size}`);

  snapshot.forEach(doc => {
    const data = doc.data();
    // Search for any field containing r2.dev or video URLs
    const fields = [];
    Object.entries(data).forEach(([key, val]) => {
      const valStr = JSON.stringify(val);
      if (valStr && (valStr.includes('r2.dev') || valStr.includes('.mp4') || valStr.includes('youtube') || valStr.includes('youtu.be'))) {
        fields.push(`${key}: ${valStr}`);
      }
    });

    if (fields.length > 0) {
      console.log(`Post ID: ${doc.id}`);
      fields.forEach(f => console.log(`  -> ${f}`));
    }
  });

  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
