'use server';

import Database from 'better-sqlite3';
import { join } from 'path';
import { Fornlamning, fornlamningSchema } from '../fornlamningar/dbSchema';
import { Bounds } from '../models';

const getFornlamningar = async (
  bounds: Bounds | null
): Promise<Fornlamning[]> => {
  try {
    const dbPath = join(
      process.cwd(),
      'public',
      'fornlamningar_filtered_20km.sqlite'
    );

    const db = new Database(dbPath);

    const whereClause = bounds
      ? `WHERE latitude BETWEEN ${bounds.southwest.lat} AND ${bounds.northeast.lat} AND longitude BETWEEN ${bounds.southwest.lng} AND ${bounds.northeast.lng} AND generatedDescription IS NOT NULL`
      : 'WHERE generatedDescription IS NOT NULL';

    const sqlQuery = `SELECT * FROM fornlamningar ${whereClause} ORDER BY generatedDescription ASC LIMIT 50`;

    const rows = db.prepare(sqlQuery).all() as any[];

    db.close();

    // Clean and validate each row with Zod schema
    const validatedRows: Fornlamning[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Clean the data before validation
        const cleanedRow = {
          ...row,
          name: row.name || row.class,
          generatedDescription: row.generatedDescription || null,
          // Ensure coordinates are valid numbers
          latitude:
            typeof row.latitude === 'number' && Number.isFinite(row.latitude)
              ? row.latitude
              : 0,
          longitude:
            typeof row.longitude === 'number' && Number.isFinite(row.longitude)
              ? row.longitude
              : 0,
        };

        // Skip records with invalid coordinates
        if (cleanedRow.latitude === 0 && cleanedRow.longitude === 0) {
          continue;
        }

        const validatedRow = fornlamningSchema.parse(cleanedRow);
        validatedRows.push(validatedRow);
      } catch (error) {
        continue;
      }
    }

    return validatedRows;
  } catch (error) {
    return [];
  }
};

export default getFornlamningar;
