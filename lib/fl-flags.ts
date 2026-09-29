import { pool } from '@/lib/db';

/**
 * Notes from the admin that something about a place is wrong.
 *
 * A row stays until it is deleted. corrected_at means the problem was
 * fixed and the note is kept. The export is every row, open ones first.
 */

export type PlaceFlag = {
  id: string;
  place_uuid: string;
  note: string;
  created_at: string;
  corrected_at: string | null;
};

type Row = {
  id: string;
  place_uuid: string;
  note: string;
  created_at: Date;
  corrected_at: Date | null;
};

function missingTable(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '42P01'
  );
}

function out(row: Row): PlaceFlag {
  return {
    id: row.id,
    place_uuid: row.place_uuid,
    note: row.note,
    created_at: new Date(row.created_at).toISOString(),
    corrected_at: row.corrected_at
      ? new Date(row.corrected_at).toISOString()
      : null,
  };
}

const SELECT = `SELECT id::text AS id, place_uuid, note, created_at, corrected_at`;

export async function flagsForPlace(uuid: string): Promise<PlaceFlag[]> {
  try {
    const { rows } = await pool.query<Row>(
      `${SELECT}
         FROM fl_place_flags
        WHERE place_uuid = $1
        ORDER BY corrected_at IS NULL DESC, created_at DESC`,
      [uuid]
    );
    return rows.map(out);
  } catch (err) {
    if (missingTable(err)) {
      return [];
    }
    throw err;
  }
}

/** Open notes, or every note when `openOnly` is false. Open ones first. */
export async function listFlags(openOnly: boolean): Promise<PlaceFlag[]> {
  try {
    const { rows } = await pool.query<Row>(
      `${SELECT}
         FROM fl_place_flags
        WHERE ($1::bool IS FALSE OR corrected_at IS NULL)
        ORDER BY corrected_at IS NULL DESC, created_at DESC`,
      [openOnly]
    );
    return rows.map(out);
  } catch (err) {
    if (missingTable(err)) {
      return [];
    }
    throw err;
  }
}

export async function addFlag(
  uuid: string,
  note: string,
  uid: string
): Promise<PlaceFlag> {
  const { rows } = await pool.query<Row>(
    `INSERT INTO fl_place_flags (place_uuid, note, created_by)
     VALUES ($1, $2, $3)
     RETURNING id::text AS id, place_uuid, note, created_at, corrected_at`,
    [uuid, note, uid]
  );
  return out(rows[0]);
}

/** Sets corrected_at once. A second call leaves the first time in place. */
export async function correctFlag(
  id: string,
  uid: string
): Promise<PlaceFlag | null> {
  const { rows } = await pool.query<Row>(
    `UPDATE fl_place_flags
        SET corrected_at = COALESCE(corrected_at, now()),
            corrected_by = COALESCE(corrected_by, $2)
      WHERE id = $1::bigint
      RETURNING id::text AS id, place_uuid, note, created_at, corrected_at`,
    [id, uid]
  );
  return rows[0] ? out(rows[0]) : null;
}

export async function deleteFlag(id: string): Promise<boolean> {
  const deleted = await pool.query(
    `DELETE FROM fl_place_flags WHERE id = $1::bigint`,
    [id]
  );
  return (deleted.rowCount ?? 0) > 0;
}
