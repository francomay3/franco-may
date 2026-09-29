'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@mantine/core';

/**
 * One search for the admin. Enter opens a place when the query is an id or
 * the only hit, and the results page otherwise. The decision is the search
 * route's; this only sends the text there.
 */
export function SearchBox({ initial = '' }: { initial?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initial);

  useEffect(() => {
    setQuery(initial);
  }, [initial]);

  return (
    <form
      className="fl-search"
      onSubmit={e => {
        e.preventDefault();
        const q = query.trim();
        if (!q) {
          return;
        }
        router.push(
          `/fornlamningar/admin/sites/search?q=${encodeURIComponent(q)}`
        );
      }}
    >
      <input
        aria-label="Search places"
        placeholder="Name, description or id"
        value={query}
        onChange={e => setQuery(e.currentTarget.value)}
      />
      <Button type="submit" radius="xl" color="dark" size="sm">
        Search
      </Button>
    </form>
  );
}
