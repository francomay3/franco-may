'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@mantine/core';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import 'mantine-datatable/styles.css';
import { AdminGate } from '../gate';
import { SearchBox } from '../search-box';

/**
 * The table draws the headers, the sort arrows and the pager. Sorting and
 * filtering the rows is a few lines because that is the part this library
 * leaves to the caller: it never reorders `records` on its own.
 */

const PAGE = 50;

type PlaceRow = {
  id: string;
  name: string;
  photos: number;
  sources: number;
  rating: number | null;
  votes: number;
  estimate: number | null;
  comments: number;
};

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
  const [rows, setRows] = useState<PlaceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<DataTableSortStatus<PlaceRow>>({
    columnAccessor: 'name',
    direction: 'asc',
  });

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

  const sorted = useMemo(() => ordered(rows ?? [], sort), [rows, sort]);
  const pageRows = sorted.slice((page - 1) * PAGE, page * PAGE);

  return (
    <div className="fl-sites">
      <p className="fl-sub fl-sites-note">
        Photos is every photograph held for the place. The app receives at most
        six of them. Rating is what visitors gave, and how many. Estimate is the
        app&apos;s own stars, which is what the app shows until somebody rates
        the place.
      </p>
      <SearchBox />
      {error ? (
        <Alert color="red" title="Could not load">
          {error}
        </Alert>
      ) : (
        <>
          <p className="fl-count">
            {rows
              ? `${sorted.length.toLocaleString('sv-SE')} places`
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
            onRowClick={({ record }) =>
              router.push(`/fornlamningar/admin/${record.id}`)
            }
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
