import { deleteField, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Seen state: one document per person, { seen: { <videoId>: <millis> } }.
 * Loading it is one read however many videos are marked; a toggle is one
 * write. A video is unseen unless it has an entry.
 */
const userDoc = (uid: string) => doc(db, 'ht_users', uid);

export async function loadSeen(uid: string): Promise<Set<string>> {
  const snap = await getDoc(userDoc(uid));
  const seen = (snap.data()?.seen ?? {}) as Record<string, number>;
  return new Set(Object.keys(seen));
}

export async function setSeen(
  uid: string,
  videoId: string,
  seen: boolean
): Promise<void> {
  await setDoc(
    userDoc(uid),
    { seen: { [videoId]: seen ? Date.now() : deleteField() } },
    { merge: true }
  );
}
