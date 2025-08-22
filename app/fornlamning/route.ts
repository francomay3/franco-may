import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const htmlContent = readFileSync(
      join(process.cwd(), 'public', 'fornlamning.html'),
      'utf-8'
    );

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error reading fornlamning.html:', error);
    return new NextResponse('File not found', { status: 404 });
  }
}
