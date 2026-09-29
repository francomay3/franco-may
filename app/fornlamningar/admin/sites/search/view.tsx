'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Group, Loader, Pagination, Text } from '@mantine/core';
import { AdminGate } from '../../gate';
import { SearchBox } from '../../search-box';
import type { SearchHit } from '@/lib/fl-search';

const PAGE = 40;

const KIND: Record<SearchHit['kind'], string> = {
  title: 'Title',
  'title-fuzzy': 'Title, approximate',
  description: 'Description',
  'description-fuzzy': 'Description, approximate',
  id: 'Id',
};

function label(hit: SearchHit): string {
  const kind = KIND[hit.kind];
  if (hit.lang === 'en') {
    return `${kind} · English`;
  }
  if (hit.lang === 'sv') {
    return `${kind} · Swedish`;
  }
  return kind;
}

function Results({ token }: { token: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get('q')?.trim() ?? '';
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    if (!q) {
      setHits([]);
      setTotal(0);
      return;
    }
    let gone = false;
    setHits(null);
    setError(null);
    void (async () => {
      try {
        const res = await fetch(
          `/api/fornlamningar/search?q=${encodeURIComponent(q)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) {
          if (!gone) {
            setError(`${res.status}`);
          }
          return;
        }
        const body = (await res.json()) as {
          redirect?: string;
          hits?: SearchHit[];
          total?: number;
        };
        if (gone) {
          return;
        }
        if (body.redirect) {
          router.replace(`/fornlamningar/admin/${body.redirect}`);
          return;
        }
        setHits(body.hits ?? []);
        setTotal(body.total ?? body.hits?.length ?? 0);
      } catch (e) {
        if (!gone) {
          setError(e instanceof Error ? e.message : 'failed');
        }
      }
    })();
    return () => {
      gone = true;
    };
  }, [q, token, router]);

  const pageHits = (hits ?? []).slice((page - 1) * PAGE, page * PAGE);
  const pages = Math.ceil((hits?.length ?? 0) / PAGE);

  return (
    <div className="fl-search-page">
      <SearchBox initial={q} />
      {error ? (
        <Alert color="red" title="Could not search">
          {error}
        </Alert>
      ) : null}
      {!q ? (
        <p className="fl-empty">Search a name, a description, or an id.</p>
      ) : null}
      {q && hits === null && !error ? (
        <Group>
          <Loader size="sm" />
          <Text>Searching…</Text>
        </Group>
      ) : null}
      {hits && hits.length === 0 && q && !error ? (
        <p className="fl-empty">No places matched.</p>
      ) : null}
      {hits && hits.length > 0 ? (
        <>
          <p className="fl-count">
            {total > hits.length
              ? `${hits.length.toLocaleString('sv-SE')} of ${total.toLocaleString('sv-SE')} places`
              : `${total.toLocaleString('sv-SE')} places`}
          </p>
          <div className="fl-hits">
            {pageHits.map(hit => (
              <a
                key={hit.id}
                href={`/fornlamningar/admin/${hit.id}`}
                className="fl-hit"
              >
                <span className="fl-hit-name">{hit.name || '—'}</span>
                <span className="fl-hit-meta">
                  {label(hit)} · {hit.id.slice(0, 8)}
                </span>
                {hit.snippet ? (
                  <p className="fl-hit-snippet">{hit.snippet}</p>
                ) : null}
              </a>
            ))}
          </div>
          {pages > 1 ? (
            <div className="fl-pager">
              <Pagination
                total={pages}
                value={page}
                onChange={setPage}
                color="dark"
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <AdminGate title="Search">{token => <Results token={token} />}</AdminGate>
  );
}
