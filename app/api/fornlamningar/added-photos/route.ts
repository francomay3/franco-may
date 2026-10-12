import { NextResponse } from 'next/server';
import { shipPhotos, type AddedPhotoRow } from '@/lib/added-photo';
import { pool } from '@/lib/db';

/**
 * The photographs added on the admin page, for the phone.
 *
 * NOT an event in the contribution log. That log is append-only, and a
 * photograph taken back has to disappear: the table is the whole list, so
 * this response is too. The phone replaces its copy on each fetch. A
 * missing row is one somebody removed, skipped, or never prioritized.
 *
 * The bundled catalog stays the offline list. This is the part that
 * changes when someone pastes a picture, and it is one request for every
 * place rather than one request per place.
 *
 * A hand-added file and a pasted file ship. A nearby file ships only when
 * it is prioritized and a licence is known. Skipped and removed rows stay
 * out. Six per place, prioritized first.
 */

function missingTable(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '42P01'
  );
}

export async function GET() {
  try {
    const { rows } = await pool.query<AddedPhotoRow>(
      `SELECT place_uuid, file, thumb, page, author, licence, licence_url,
              image_url
         FROM fl_photos_added
        WHERE removed_at IS NULL
          AND NOT skipped
          AND (
            source IN ('hand', 'paste')
            OR (source = 'geosearch' AND prioritized
                AND licence IS NOT NULL AND licence <> '')
          )
        ORDER BY place_uuid, prioritized DESC, created_at ASC, id ASC`
    );
    return NextResponse.json(
      { photos: shipPhotos(rows) },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    if (missingTable(err)) {
      return NextResponse.json(
        { error: 'added photographs are not available' },
        { status: 503 }
      );
    }
    throw err;
  }
}
