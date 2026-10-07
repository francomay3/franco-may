import { Suspense } from 'react';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Metadata } from 'next';
import { placeUuidOf } from '@/lib/lamning';
import PlaceAdmin from './view';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ featureid: string }>;
}): Promise<Metadata> {
  const { featureid } = await params;
  const uuid = placeUuidOf(decodeURIComponent(featureid));
  let title = 'Place';
  if (uuid) {
    try {
      const bag = JSON.parse(
        readFileSync(
          join(
            process.cwd(),
            'public',
            'descriptions',
            `${uuid.slice(0, 2)}.json`
          ),
          'utf8'
        )
      ) as Record<string, { title?: string }>;
      const name = bag[uuid]?.title?.trim();
      if (name) {
        title = name;
      }
    } catch {
      // A place with no published text still has a page.
    }
  }
  return { title: `${title} · Fornkoll` };
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PlaceAdmin />
    </Suspense>
  );
}
