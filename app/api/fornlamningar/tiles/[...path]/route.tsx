import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { gunzip } from 'zlib';
import { promisify } from 'util';

const gunzipAsync = promisify(gunzip);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Extract the path segments (z/x/y.pbf)
    const { path } = await params;

    if (!path || path.length !== 3) {
      return new NextResponse('Invalid tile path', { status: 400 });
    }

    const [z, x, y] = path;

    // Validate that y ends with .pbf
    if (!y.endsWith('.pbf')) {
      return new NextResponse('Invalid tile format', { status: 400 });
    }

    // Construct the path to the tile file in the (tiles) folder
    const tilePath = join(
      process.cwd(),
      'app',
      'api',
      'fornlamningar',
      '(tiles)',
      z,
      x,
      y
    );

    // Check if the file exists
    let tileData: Buffer;
    if (!existsSync(tilePath)) {
      // Return empty PBF file if tile not found
      const emptyPbfPath = join(
        process.cwd(),
        'app',
        'api',
        'fornlamningar',
        'tiles',
        'empty.pbf'
      );
      const emptyRawData = await readFile(emptyPbfPath);

      // Check if the empty file is gzipped (shouldn't be, but for consistency)
      const isEmptyGzipped =
        emptyRawData.length >= 2 &&
        emptyRawData[0] === 0x1f &&
        emptyRawData[1] === 0x8b;

      if (isEmptyGzipped) {
        tileData = await gunzipAsync(emptyRawData);
      } else {
        tileData = emptyRawData;
      }
    } else {
      // Read the requested PBF file
      const rawData = await readFile(tilePath);

      // Check if the file is gzipped by looking at the magic bytes
      const isGzipped =
        rawData.length >= 2 && rawData[0] === 0x1f && rawData[1] === 0x8b;

      if (isGzipped) {
        // Decompress gzipped data
        tileData = await gunzipAsync(rawData);
      } else {
        // Use raw data if not gzipped
        tileData = rawData;
      }
    }

    // Create response with appropriate headers for PBF tiles
    const response = new NextResponse(tileData, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-protobuf',
        'Content-Length': tileData.length.toString(),
        // Cache control for tiles - immutable since they don't change
        'Cache-Control': 'public, immutable, max-age=31536000', // 1 year
        // Additional headers for tile serving
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        // Prevent double compression since PBF files are already compressed
        'Content-Encoding': 'identity',
      },
    });

    return response;
  } catch (error) {
    console.error('Error serving tile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
