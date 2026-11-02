import { deleteField, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
  type Bounds,
  type SavedSearch,
  type Taxonomy,
  restoreSearch,
} from './filters';

/**
 * Everything saved about a person, in one document:
 *
 *   ht_users/{uid} = {
 *     seen:     { <videoId>: <millis> },
 *     searches: { <id>: { name, filters, sort, createdAt } },
 *   }
 *
 * Loading it is one read however much is stored; a toggle or a save is one
 * write. A video is unseen unless it has an entry. Each person has their own
 * document, which is what keeps one account's seen marks and playlists apart
 * from another's.
 */
const userDoc = (uid: string) => doc(db, 'ht_users', uid);

export type RawUserData = {
  seen: string[];
  searches: [id: string, raw: unknown][];
};

export type UserData = { seen: Set<string>; searches: SavedSearch[] };

/** Fetched raw so it can load in parallel with the dataset it is checked against. */
export async function loadUserData(uid: string): Promise<RawUserData> {
  const data = (await getDoc(userDoc(uid))).data() ?? {};
  return {
    seen: Object.keys((data.seen ?? {}) as object),
    searches: Object.entries((data.searches ?? {}) as object),
  };
}

export function parseUserData(
  raw: RawUserData,
  bounds: Bounds,
  tax: Taxonomy
): UserData {
  return {
    seen: new Set(raw.seen),
    searches: raw.searches
      .map(([id, r]) => restoreSearch(id, r, bounds, tax))
      .filter((s): s is SavedSearch => s !== null)
      .sort((a, b) => b.createdAt - a.createdAt),
  };
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

export async function saveSearch(
  uid: string,
  search: SavedSearch
): Promise<void> {
  const { id, ...rest } = search;
  await setDoc(userDoc(uid), { searches: { [id]: rest } }, { merge: true });
}

export async function deleteSearch(uid: string, id: string): Promise<void> {
  await setDoc(
    userDoc(uid),
    { searches: { [id]: deleteField() } },
    { merge: true }
  );
}
