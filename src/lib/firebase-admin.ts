import admin from 'firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';

let db: Firestore | null = null;

function getFirestoreAdmin(): Firestore {
  if (db) return db;

  if (!admin.apps.length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountJson) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT env var is not set. Add it to .env.local.'
      );
    }

    let serviceAccount: admin.ServiceAccount;
    try {
      serviceAccount = JSON.parse(
        Buffer.from(serviceAccountJson, 'base64').toString('utf-8')
      ) as admin.ServiceAccount;
    } catch {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT is not valid base64-encoded JSON. ' +
          'Run: base64 -w0 your-service-account.json'
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  db = admin.firestore();
  return db;
}

export { getFirestoreAdmin };
