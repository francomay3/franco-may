'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * The old results page. A search is a filter on the sites table now, so
 * this address only forwards there.
 */
export default function SearchRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const q = params.get('q')?.trim() ?? '';
    router.replace(
      q
        ? `/fornlamningar/admin/sites?q=${encodeURIComponent(q)}`
        : '/fornlamningar/admin/sites'
    );
  }, [params, router]);

  return null;
}
