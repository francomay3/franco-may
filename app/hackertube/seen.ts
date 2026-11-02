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
 *     seen:       { <videoId>: <millis> },
 *     watchLater: { <videoId>: <millis added> },
 *     liked:      { <videoId>: <millis liked> },
 *     disliked:   { <videoId>: <millis> },   // "not interested"
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
  watchLater: [id: string, addedAt: unknown][];
  liked: [id: string, at: unknown][];
  disliked: [id: string, at: unknown][];
  searches: [id: string, raw: unknown][];
};

export type UserData = {
  seen: Set<string>;
  /** Video id to when it was added, so the list can be shown newest first. */
  watchLater: Map<string, number>;
  /** Video id to when it was liked. Never also in `disliked`. */
  liked: Map<string, number>;
  disliked: Map<string, number>;
  searches: SavedSearch[];
};

export type Reaction = 'like' | 'dislike';

export function reactionOf(
  id: string,
  liked: ReadonlyMap<string, number>,
  disliked: ReadonlyMap<string, number>
): Reaction | null {
  return liked.has(id) ? 'like' : disliked.has(id) ? 'dislike' : null;
}

/** Fetched raw so it can load in parallel with the dataset it is checked against. */
export async function loadUserData(uid: string): Promise<RawUserData> {
  const data = (await getDoc(userDoc(uid))).data() ?? {};
  return {
    seen: Object.keys((data.seen ?? {}) as object),
    watchLater: Object.entries((data.watchLater ?? {}) as object),
    liked: Object.entries((data.liked ?? {}) as object),
    disliked: Object.entries((data.disliked ?? {}) as object),
    searches: Object.entries((data.searches ?? {}) as object),
  };
}

const toTimes = (entries: [string, unknown][]) =>
  new Map(entries.map(([id, at]) => [id, typeof at === 'number' ? at : 0]));

export function parseUserData(
  raw: RawUserData,
  bounds: Bounds,
  tax: Taxonomy
): UserData {
  return {
    seen: new Set(raw.seen),
    watchLater: new Map(
      raw.watchLater.map(([id, at]) => [id, typeof at === 'number' ? at : 0])
    ),
    liked: toTimes(raw.liked),
    disliked: toTimes(raw.disliked),
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

export async function setWatchLater(
  uid: string,
  videoId: string,
  on: boolean
): Promise<void> {
  await setDoc(
    userDoc(uid),
    { watchLater: { [videoId]: on ? Date.now() : deleteField() } },
    { merge: true }
  );
}

/**
 * A video is liked, not interested, or neither. One write sets both fields, so
 * changing your mind never leaves it in both.
 */
export async function setReaction(
  uid: string,
  videoId: string,
  reaction: Reaction | null
): Promise<void> {
  const now = Date.now();
  await setDoc(
    userDoc(uid),
    {
      liked: { [videoId]: reaction === 'like' ? now : deleteField() },
      disliked: { [videoId]: reaction === 'dislike' ? now : deleteField() },
    },
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
