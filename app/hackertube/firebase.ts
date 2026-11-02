import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * The franco-may Firebase project, not the fornlamningar one.
 *
 * THE CONFIG IS NOT A SECRET. A Firebase apiKey identifies the project; it
 * authorises nothing. Who may read what is decided by firestore.hackertube.rules
 * and storage.hackertube.rules, against a token Google signed.
 */
const CONFIG = {
  apiKey: 'AIzaSyAZIvYvVWdCjAWwUYYaUeAz9-n-wZQeaPg',
  authDomain: 'franco-may.firebaseapp.com',
  projectId: 'franco-may',
  storageBucket: 'franco-may.appspot.com',
  messagingSenderId: '1044809313252',
  appId: '1:1044809313252:web:d8283b4b02d206bca1f5f1',
};

// A named app so this never collides with another Firebase app on the site.
// getApps() first: hot reload re-runs this module and initializeApp twice
// under one name throws.
const app =
  getApps().find(a => a.name === 'hackertube') ??
  initializeApp(CONFIG, 'hackertube');

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
