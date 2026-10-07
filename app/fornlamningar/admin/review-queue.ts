/**
 * The pass started from the sites table.
 *
 * The ids are the filtered, sorted rows from the page the button was on,
 * through the end of that list. They stay in the tab: a few thousand uuids
 * do not belong in the address. The address only carries `review=1`, so a
 * place opened from a row of the table is not in the pass.
 */

const KEY = 'fl-admin-review';

export type ReviewQueue = {
  ids: string[];
  /** Sites table, filters included, to return to when the pass ends. */
  returnHref: string;
};

export function saveReview(queue: ReviewQueue) {
  sessionStorage.setItem(KEY, JSON.stringify(queue));
}

export function loadReview(): ReviewQueue | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<ReviewQueue>;
    if (
      !parsed ||
      !Array.isArray(parsed.ids) ||
      parsed.ids.some(id => typeof id !== 'string') ||
      typeof parsed.returnHref !== 'string'
    ) {
      return null;
    }
    return { ids: parsed.ids, returnHref: parsed.returnHref };
  } catch {
    return null;
  }
}
