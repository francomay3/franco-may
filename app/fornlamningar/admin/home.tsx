'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminGate } from './gate';

type Summary = {
  comments: number;
  photos: number;
  matches: number;
  flags: number;
};

function words(n: number, one: string, many: string) {
  return `${n.toLocaleString('sv-SE')} ${n === 1 ? one : many}`;
}

function HomeNav({ token }: { token: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [quiet, setQuiet] = useState(false);

  useEffect(() => {
    let gone = false;
    void (async () => {
      try {
        const res = await fetch('/api/fornlamningar/summary', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!gone) {
            setQuiet(true);
          }
          return;
        }
        const body = (await res.json()) as Summary;
        if (
          !gone &&
          [body.comments, body.photos, body.matches, body.flags].every(
            n => typeof n === 'number'
          )
        ) {
          setSummary(body);
        } else if (!gone) {
          setQuiet(true);
        }
      } catch {
        // The cards still open. A missing count is quieter than an error.
        if (!gone) {
          setQuiet(true);
        }
      }
    })();
    return () => {
      gone = true;
    };
  }, [token]);

  return (
    <nav className="fl-nav">
      <Link className="fl-nav-card" href="/fornlamningar/admin/moderation">
        <span className="fl-nav-copy">
          <span className="fl-nav-title">Moderation</span>
          <span className="fl-nav-note">
            Comments and photos waiting for a look.
          </span>
        </span>
        {summary == null && !quiet ? (
          <span className="fl-nav-skel" />
        ) : summary && summary.comments === 0 && summary.photos === 0 ? (
          <span className="fl-nav-pill">All set</span>
        ) : summary ? (
          <span className="fl-nav-stat is-due is-pair">
            <span className="fl-nav-label">
              {words(summary.comments, 'comment', 'comments')}
            </span>
            <span className="fl-nav-label">
              {words(summary.photos, 'photo', 'photos')}
            </span>
          </span>
        ) : null}
      </Link>
      <Link className="fl-nav-card" href="/fornlamningar/admin/sites">
        <span className="fl-nav-copy">
          <span className="fl-nav-title">Sites</span>
          <span className="fl-nav-note">
            Every published place, with photos, sources and ratings.
          </span>
        </span>
      </Link>
      <Link className="fl-nav-card" href="/fornlamningar/admin/compare">
        <span className="fl-nav-copy">
          <span className="fl-nav-title">Compare</span>
          <span className="fl-nav-note">
            Which of two places is more striking. Tie when they match, skip when
            you cannot tell.
          </span>
        </span>
        {summary == null && !quiet ? (
          <span className="fl-nav-skel" />
        ) : summary ? (
          <span className="fl-nav-stat">
            <strong className="fl-nav-num">
              {summary.matches.toLocaleString('sv-SE')}
            </strong>
            <span className="fl-nav-label">
              {summary.matches === 1 ? 'match' : 'matches'}
            </span>
          </span>
        ) : null}
      </Link>
      <Link className="fl-nav-card" href="/fornlamningar/admin/flags">
        <span className="fl-nav-copy">
          <span className="fl-nav-title">Flags</span>
          <span className="fl-nav-note">Notes on places that need a fix.</span>
        </span>
        {summary == null && !quiet ? (
          <span className="fl-nav-skel" />
        ) : summary && summary.flags === 0 ? (
          <span className="fl-nav-pill">None open</span>
        ) : summary ? (
          <span className="fl-nav-stat is-due">
            <strong className="fl-nav-num">
              {summary.flags.toLocaleString('sv-SE')}
            </strong>
            <span className="fl-nav-label">open</span>
          </span>
        ) : null}
      </Link>
      <Link className="fl-nav-card" href="/fornlamningar/map">
        <span className="fl-nav-copy">
          <span className="fl-nav-title">Map</span>
          <span className="fl-nav-note">Browse every place on the map.</span>
        </span>
      </Link>
    </nav>
  );
}

export default function AdminHome() {
  return (
    <AdminGate title="Admin">{token => <HomeNav token={token} />}</AdminGate>
  );
}
