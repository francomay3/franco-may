'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Checkbox, Modal } from '@mantine/core';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import 'mantine-datatable/styles.css';
import { FILTER_FAMILIES } from '../../filterFamilies';
import { familyLabel } from '../../familyLabels';
import { AdminGate } from '../gate';
import { SearchBox } from '../search-box';

/**
 * The table draws the headers, the sort arrows and the pager. Sorting and
 * filtering the rows is a few lines because that is the part this library
 * leaves to the caller: it never reorders `records` on its own.
 *
 * The wheel button opens the place in a new tab and leaves this one in
 * front. That only happens for a real link: window.open() would switch to
 * the new tab. The page scrolls, so a wheel click would otherwise start
 * scrolling; the overflow is held still for that press, and the browser
 * opens the tab itself.
 */

const PAGE = 50;

type PlaceRow = {
  id: string;
  name: string;
  kind: string;
  family: string;
  photos: number;
  prioritized: boolean;
  uninteresting: boolean;
  verified_at: string | null;
  sources: number;
  rating: number | null;
  votes: number;
  score: number | null;
  estimate: number | null;
  comments: number;
};

function placeHref(id: string): string {
  return `/fornlamningar/admin/${id}`;
}

function suspendAutoscroll(node: Element) {
  const scroller = node.closest('.fl-admin');
  if (!(scroller instanceof HTMLElement)) {
    return;
  }
  const top = scroller.scrollTop;
  const prev = scroller.style.overflow;
  scroller.style.overflow = 'hidden';
  scroller.scrollTop = top;
  const restore = () => {
    scroller.style.overflow = prev;
    scroller.scrollTop = top;
    window.removeEventListener('mouseup', restore, true);
  };
  window.addEventListener('mouseup', restore, true);
}

function RowLink({
  id,
  onOpen,
  children,
}: {
  id: string;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  return (
    <a
      href={placeHref(id)}
      className="fl-row-link"
      onMouseDown={event => {
        if (event.button === 1) {
          suspendAutoscroll(event.currentTarget);
        }
      }}
      onClick={event => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        onOpen();
      }}
    >
      {children}
    </a>
  );
}

function ordered(rows: PlaceRow[], sort: DataTableSortStatus<PlaceRow>) {
  const dir = sort.direction === 'asc' ? 1 : -1;
  const key = sort.columnAccessor as keyof PlaceRow;
  return [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av == null && bv == null) {
      return a.id.localeCompare(b.id);
    }
    if (av == null) {
      return 1;
    }
    if (bv == null) {
      return -1;
    }
    if (typeof av === 'number' && typeof bv === 'number') {
      return av === bv ? a.id.localeCompare(b.id) : (av - bv) * dir;
    }
    const cmp = String(av).localeCompare(String(bv), 'sv');
    return cmp === 0 ? a.id.localeCompare(b.id) : cmp * dir;
  });
}

function SiteTable({ token }: { token: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [rows, setRows] = useState<PlaceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<DataTableSortStatus<PlaceRow>>({
    columnAccessor: 'name',
    direction: 'asc',
  });
  const [q, setQ] = useState(params.get('q') ?? '');
  const [over6, setOver6] = useState(params.get('over6') === '1');
  const [noPriority, setNoPriority] = useState(params.get('unmarked') === '1');
  const [onlyDull, setOnlyDull] = useState(params.get('uninteresting') === '1');
  const [unverified, setUnverified] = useState(
    params.get('unverified') === '1'
  );
  const [verifiedBefore, setVerifiedBefore] = useState(
    params.get('before') ?? ''
  );
  const [families, setFamilies] = useState<string[]>(() =>
    (params.get('families') ?? '').split('|').filter(Boolean)
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Null while a query is in flight. The order is the search rank: a literal
  // title, then a fuzzy title, then the same two for the description, in
  // Swedish and in English.
  const [hits, setHits] = useState<string[] | null>(null);

  useEffect(() => {
    let gone = false;
    void (async () => {
      try {
        const res = await fetch('/api/fornlamningar/places', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!gone) {
            setError(`${res.status}`);
          }
          return;
        }
        const body = (await res.json()) as { places: PlaceRow[] };
        if (!gone) {
          setRows(body.places);
        }
      } catch (e) {
        if (!gone) {
          setError(e instanceof Error ? e.message : 'failed');
        }
      }
    })();
    return () => {
      gone = true;
    };
  }, [token]);

  useEffect(() => {
    const needle = q.trim();
    if (!needle) {
      setHits(null);
      return;
    }
    setHits(null);
    let gone = false;
    const wait = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/fornlamningar/search?q=${encodeURIComponent(needle)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!res.ok || gone) {
            return;
          }
          const body = (await res.json()) as {
            redirect?: string;
            hits?: { id: string }[];
          };
          if (gone) {
            return;
          }
          if (body.redirect) {
            setHits([body.redirect]);
          } else {
            setHits((body.hits ?? []).map(hit => hit.id));
          }
        } catch {
          if (!gone) {
            setHits([]);
          }
        }
      })();
    }, 200);
    return () => {
      gone = true;
      clearTimeout(wait);
    };
  }, [q, token]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q.trim()) {
      p.set('q', q.trim());
    }
    if (over6) {
      p.set('over6', '1');
    }
    if (noPriority) {
      p.set('unmarked', '1');
    }
    if (onlyDull) {
      p.set('uninteresting', '1');
    }
    if (unverified) {
      p.set('unverified', '1');
    }
    if (verifiedBefore) {
      p.set('before', verifiedBefore);
    }
    if (families.length) {
      p.set('families', families.join('|'));
    }
    const next = p.toString();
    const current = window.location.search.replace(/^\?/, '');
    if (next !== current) {
      window.history.replaceState(
        null,
        '',
        next ? `?${next}` : window.location.pathname
      );
    }
  }, [q, over6, noPriority, onlyDull, unverified, verifiedBefore, families]);

  const familyChoices = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows ?? []) {
      if (!row.family) {
        continue;
      }
      counts.set(row.family, (counts.get(row.family) ?? 0) + 1);
    }
    const known = new Set(FILTER_FAMILIES.map(f => f.id));
    const listed = FILTER_FAMILIES.filter(f => (counts.get(f.id) ?? 0) > 0).map(
      f => ({
        id: f.id,
        icon: f.icon,
        count: counts.get(f.id) ?? 0,
      })
    );
    for (const [id, count] of counts) {
      if (!known.has(id)) {
        listed.push({ id, icon: 'unknown', count });
      }
    }
    return listed;
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim();
    const picked = new Set(families);
    const matched = needle ? new Set(hits ?? []) : null;
    return (rows ?? []).filter(row => {
      if (over6 && row.photos <= 6) {
        return false;
      }
      if (noPriority && row.prioritized) {
        return false;
      }
      if (onlyDull && !row.uninteresting) {
        return false;
      }
      const signed = row.verified_at
        ? new Date(row.verified_at).getTime()
        : null;
      const cutoff = verifiedBefore ? new Date(verifiedBefore).getTime() : null;
      const stale =
        cutoff != null &&
        Number.isFinite(cutoff) &&
        signed != null &&
        signed < cutoff;
      const never = signed == null;
      if (unverified && Number.isFinite(cutoff ?? NaN)) {
        if (!never && !stale) {
          return false;
        }
      } else if (unverified && !never) {
        return false;
      } else if (cutoff != null && Number.isFinite(cutoff) && !stale) {
        return false;
      }
      if (picked.size > 0 && !picked.has(row.family)) {
        return false;
      }
      if (matched && !matched.has(row.id)) {
        return false;
      }
      return true;
    });
  }, [
    rows,
    q,
    over6,
    noPriority,
    onlyDull,
    unverified,
    verifiedBefore,
    families,
    hits,
  ]);

  const sorted = useMemo(() => {
    if (q.trim() && hits) {
      const order = new Map(hits.map((id, i) => [id, i]));
      return [...filtered].sort(
        (a, b) =>
          (order.get(a.id) ?? hits.length) - (order.get(b.id) ?? hits.length) ||
          a.id.localeCompare(b.id)
      );
    }
    return ordered(filtered, sort);
  }, [filtered, sort, q, hits]);
  const pageRows = sorted.slice((page - 1) * PAGE, page * PAGE);
  const filterCount =
    (over6 ? 1 : 0) +
    (noPriority ? 1 : 0) +
    (onlyDull ? 1 : 0) +
    (unverified ? 1 : 0) +
    (verifiedBefore ? 1 : 0) +
    (families.length > 0 ? 1 : 0);

  const cell = (id: string, children: React.ReactNode) => (
    <RowLink id={id} onOpen={() => router.push(placeHref(id))}>
      {children}
    </RowLink>
  );

  return (
    <div className="fl-sites">
      <p className="fl-sub fl-sites-note">
        Photos is every photograph held for the place. The app receives at most
        six of them. Rating is what visitors gave, and how many. Score is the
        number the algorithm calculated. Estimate is that number as the
        app&apos;s own stars, which is what the app shows until somebody rates
        the place.
      </p>
      <div className="fl-sites-tools">
        <SearchBox
          value={q}
          onChange={value => {
            setQ(value);
            setPage(1);
          }}
        />
        <Button
          radius="xl"
          color="dark"
          variant="default"
          size="sm"
          onClick={() => setFiltersOpen(true)}
        >
          {filterCount > 0 ? `Filters · ${filterCount}` : 'Filters'}
        </Button>
      </div>
      <Modal
        opened={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        size="md"
        radius="md"
      >
        <div className="fl-filter-flags">
          <Checkbox
            label="More than 6 photos"
            checked={over6}
            onChange={e => {
              setOver6(e.currentTarget.checked);
              setPage(1);
            }}
          />
          <Checkbox
            label="No prioritized photos"
            checked={noPriority}
            onChange={e => {
              setNoPriority(e.currentTarget.checked);
              setPage(1);
            }}
          />
          <Checkbox
            label="Not interesting"
            checked={onlyDull}
            onChange={e => {
              setOnlyDull(e.currentTarget.checked);
              setPage(1);
            }}
          />
          <Checkbox
            label="Not verified"
            checked={unverified}
            onChange={e => {
              setUnverified(e.currentTarget.checked);
              setPage(1);
            }}
          />
        </div>
        <label className="fl-filter-date">
          <span>Verified before</span>
          <input
            type="datetime-local"
            value={verifiedBefore}
            onChange={e => {
              setVerifiedBefore(e.currentTarget.value);
              setPage(1);
            }}
          />
          <span className="fl-add-hint">
            Places signed off before this time.
            {unverified
              ? ' With Not verified, both are the ones due for another look.'
              : ''}
          </span>
        </label>
        <div className="fl-filter-head">
          <p className="fl-filter-title">Type</p>
          {families.length > 0 ? (
            <button
              type="button"
              className="fl-pick-filter"
              onClick={() => {
                setFamilies([]);
                setPage(1);
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
        <div className="fl-families">
          {familyChoices.map(family => (
            <Checkbox
              key={family.id}
              label={
                <span className="fl-family-label">
                  <img
                    src={`/fornlamningar-icons/svg/${family.icon}.svg`}
                    alt=""
                    width={22}
                    height={22}
                  />
                  <span>
                    {familyLabel(family.id)} ({family.count})
                  </span>
                </span>
              }
              checked={families.includes(family.id)}
              onChange={() => {
                setFamilies(prev =>
                  prev.includes(family.id)
                    ? prev.filter(id => id !== family.id)
                    : [...prev, family.id]
                );
                setPage(1);
              }}
            />
          ))}
        </div>
      </Modal>
      {error ? (
        <Alert color="red" title="Could not load">
          {error}
        </Alert>
      ) : (
        <>
          <p className="fl-count">
            {rows
              ? q.trim() && hits === null
                ? 'Searching…'
                : filterCount > 0 || q.trim()
                  ? `${sorted.length.toLocaleString('sv-SE')} of ${rows.length.toLocaleString('sv-SE')} places`
                  : `${sorted.length.toLocaleString('sv-SE')} places`
              : 'Loading…'}
          </p>
          <DataTable
            withTableBorder
            borderRadius="md"
            striped
            highlightOnHover
            minHeight={240}
            fetching={rows === null || (q.trim() !== '' && hits === null)}
            records={pageRows}
            totalRecords={sorted.length}
            recordsPerPage={PAGE}
            page={page}
            onPageChange={setPage}
            sortStatus={sort}
            onSortStatusChange={next => {
              setSort(next);
              setPage(1);
            }}
            rowClassName="fl-row"
            columns={[
              {
                accessor: 'name',
                title: 'Name',
                sortable: true,
                width: '28%',
                render: ({ id, name }) => cell(id, name || '—'),
              },
              {
                accessor: 'id',
                title: 'Id',
                sortable: true,
                width: 120,
                render: ({ id }) => cell(id, id.slice(0, 8)),
              },
              {
                accessor: 'photos',
                title: 'Photos',
                sortable: true,
                textAlign: 'right',
                render: ({ id, photos }) => cell(id, photos),
              },
              {
                accessor: 'sources',
                title: 'Sources',
                sortable: true,
                textAlign: 'right',
                render: ({ id, sources }) => cell(id, sources),
              },
              {
                accessor: 'rating',
                title: 'Rating',
                sortable: true,
                textAlign: 'right',
                render: ({ id, rating, votes }) =>
                  cell(
                    id,
                    rating == null ? '—' : `${rating.toFixed(1)} · ${votes}`
                  ),
              },
              {
                accessor: 'score',
                title: 'Score',
                sortable: true,
                textAlign: 'right',
                render: ({ id, score }) =>
                  cell(id, score == null ? '—' : score.toFixed(2)),
              },
              {
                accessor: 'estimate',
                title: 'Estimate',
                sortable: true,
                textAlign: 'right',
                render: ({ id, estimate }) => cell(id, estimate ?? '—'),
              },
              {
                accessor: 'comments',
                title: 'Comments',
                sortable: true,
                textAlign: 'right',
                render: ({ id, comments }) => cell(id, comments),
              },
            ]}
          />
        </>
      )}
    </div>
  );
}

export default function SitesPage() {
  return (
    <AdminGate title="Sites">{token => <SiteTable token={token} />}</AdminGate>
  );
}
