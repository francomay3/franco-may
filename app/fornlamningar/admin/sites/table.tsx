'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Checkbox, Modal, Table } from '@mantine/core';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import 'mantine-datatable/styles.css';
import { AdminGate } from '../gate';
import { SearchBox } from '../search-box';

/**
 * The table draws the headers, the sort arrows and the pager. Sorting and
 * filtering the rows is a few lines because that is the part this library
 * leaves to the caller: it never reorders `records` on its own.
 *
 * A row is not a link, and the page scrolls, so the wheel button starts a
 * scroll instead of opening anything. The middle button is handled here:
 * it opens the place in a new tab.
 */

const PAGE = 50;

type PlaceRow = {
  id: string;
  name: string;
  kind: string;
  photos: number;
  prioritized: boolean;
  sources: number;
  rating: number | null;
  votes: number;
  estimate: number | null;
  comments: number;
};

function fold(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('sv');
}

function looksLikeId(q: string): boolean {
  return /^[0-9a-f-]{8,}$/i.test(q) || /\d+:\d+/.test(q);
}

function placeHref(id: string): string {
  return `/fornlamningar/admin/${id}`;
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
  const [markedOnly, setMarkedOnly] = useState(params.get('marked') === '1');
  const [kinds, setKinds] = useState<string[]>(() =>
    (params.get('types') ?? '')
      .split('|')
      .filter(Boolean)
      .map(s => {
        try {
          return decodeURIComponent(s);
        } catch {
          return s;
        }
      })
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [idHit, setIdHit] = useState<string | null>(null);

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
    if (!looksLikeId(needle)) {
      setIdHit(null);
      return;
    }
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
            setIdHit(body.redirect);
          } else if (body.hits?.length === 1) {
            setIdHit(body.hits[0].id);
          } else {
            setIdHit(null);
          }
        } catch {
          if (!gone) {
            setIdHit(null);
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
    if (markedOnly) {
      p.set('marked', '1');
    }
    if (kinds.length) {
      p.set('types', kinds.map(encodeURIComponent).join('|'));
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
  }, [q, over6, markedOnly, kinds]);

  const typeChoices = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows ?? []) {
      if (!row.kind) {
        continue;
      }
      counts.set(row.kind, (counts.get(row.kind) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], 'sv'));
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = fold(q.trim());
    const picked = new Set(kinds);
    return (rows ?? []).filter(row => {
      if (over6 && row.photos <= 6) {
        return false;
      }
      if (markedOnly && !row.prioritized) {
        return false;
      }
      if (picked.size > 0 && !picked.has(row.kind)) {
        return false;
      }
      if (!needle) {
        return true;
      }
      if (idHit && row.id === idHit) {
        return true;
      }
      return (
        fold(row.name).includes(needle) ||
        row.id.startsWith(needle) ||
        fold(row.kind).includes(needle)
      );
    });
  }, [rows, q, over6, markedOnly, kinds, idHit]);

  const sorted = useMemo(() => ordered(filtered, sort), [filtered, sort]);
  const pageRows = sorted.slice((page - 1) * PAGE, page * PAGE);
  const filterCount =
    (over6 ? 1 : 0) + (markedOnly ? 1 : 0) + (kinds.length > 0 ? 1 : 0);

  const openNewTab = (id: string) => {
    window.open(placeHref(id), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fl-sites">
      <p className="fl-sub fl-sites-note">
        Photos is every photograph held for the place. The app receives at most
        six of them. Rating is what visitors gave, and how many. Estimate is the
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
        size="lg"
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
            label="Has prioritized photos"
            checked={markedOnly}
            onChange={e => {
              setMarkedOnly(e.currentTarget.checked);
              setPage(1);
            }}
          />
        </div>
        <div className="fl-filter-head">
          <p className="fl-filter-title">Type</p>
          {kinds.length > 0 ? (
            <button
              type="button"
              className="fl-pick-filter"
              onClick={() => {
                setKinds([]);
                setPage(1);
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
        <div className="fl-types">
          {typeChoices.map(([name, count]) => (
            <Checkbox
              key={name}
              label={`${name} (${count})`}
              checked={kinds.includes(name)}
              onChange={() => {
                setKinds(prev =>
                  prev.includes(name)
                    ? prev.filter(k => k !== name)
                    : [...prev, name]
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
              ? filterCount > 0 || q.trim()
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
            fetching={rows === null}
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
            onRowClick={({ record, event }) => {
              if (event.button !== 0) {
                return;
              }
              router.push(placeHref(record.id));
            }}
            rowFactory={({ record, rowProps, children, expandedElement }) => (
              <>
                <Table.Tr
                  {...rowProps}
                  onMouseDown={event => {
                    if (event.button !== 1) {
                      return;
                    }
                    event.preventDefault();
                    openNewTab(record.id);
                  }}
                >
                  {children}
                </Table.Tr>
                {expandedElement}
              </>
            )}
            columns={[
              {
                accessor: 'name',
                title: 'Name',
                sortable: true,
                width: '28%',
                render: ({ name }) => name || '—',
              },
              {
                accessor: 'id',
                title: 'Id',
                sortable: true,
                width: 120,
                render: ({ id }) => id.slice(0, 8),
              },
              {
                accessor: 'photos',
                title: 'Photos',
                sortable: true,
                textAlign: 'right',
              },
              {
                accessor: 'sources',
                title: 'Sources',
                sortable: true,
                textAlign: 'right',
              },
              {
                accessor: 'rating',
                title: 'Rating',
                sortable: true,
                textAlign: 'right',
                render: ({ rating, votes }) =>
                  rating == null ? '—' : `${rating.toFixed(1)} · ${votes}`,
              },
              {
                accessor: 'estimate',
                title: 'Estimate',
                sortable: true,
                textAlign: 'right',
                render: ({ estimate }) => estimate ?? '—',
              },
              {
                accessor: 'comments',
                title: 'Comments',
                sortable: true,
                textAlign: 'right',
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
