import type { PoolClient } from 'pg';

/**
 * Withdraw a visitor photo by appending an event. Nothing else.
 *
 * The original `photo` row stays. A phone that already copied it will never
 * ask for that row again, so deleting it would leave the url on every device
 * that had synced, with no later event to say it was gone. `photo_removed`
 * gets a new seq and travels the same path the photo did.
 *
 * The file in Storage is a different store. The caller deletes that. This
 * function does not, and it does not delete the queue row either: the queue
 * is how the photo got here, and the event is how it leaves.
 *
 * The author is the nil uuid, same as a comment removal. The events feed
 * drops a device's own rows, so a removal filed under the photographer would
 * be the one device that never received it -- their phone would keep the
 * pointer forever.
 */
const MODERATOR = '00000000-0000-0000-0000-000000000000';

export async function withdrawPhoto(
  c: PoolClient,
  eventId: string
): Promise<void> {
  const { rows: already } = await c.query(
    `SELECT 1 FROM fl_events
      WHERE kind = 'photo_removed'
        AND payload->>'target_event_id' = $1`,
    [eventId]
  );
  if (already.length) return;

  const { rows: place } = await c.query(
    `SELECT place_uuid FROM fl_photo_queue WHERE event_id = $1
     UNION ALL
     SELECT place_uuid FROM fl_events
      WHERE event_id = $1 AND kind = 'photo'
     LIMIT 1`,
    [eventId]
  );
  const placeUuid = place[0]?.place_uuid;
  if (!placeUuid) return;

  const { rows: seq } = await c.query<{ v: string }>(
    'UPDATE fl_event_seq SET v = v + 1 WHERE id = 1 RETURNING v'
  );
  await c.query(
    `INSERT INTO fl_events
       (seq, event_id, kind, place_uuid, author, payload)
     VALUES ($1, $2, 'photo_removed', $3, $4, $5)`,
    [
      Number(seq[0].v),
      crypto.randomUUID(),
      placeUuid,
      MODERATOR,
      JSON.stringify({ target_event_id: eventId }),
    ]
  );
}
