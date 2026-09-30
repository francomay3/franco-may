'use client';

import React from 'react';
import Link from 'next/link';
import { AdminGate } from './gate';

export default function AdminHome() {
  return (
    <AdminGate title="Admin">
      <nav className="fl-nav">
        <Link className="fl-nav-card" href="/fornlamningar/admin/moderation">
          <span className="fl-nav-title">Moderation</span>
          <span className="fl-nav-note">
            Comments and photos waiting for a look.
          </span>
        </Link>
        <Link className="fl-nav-card" href="/fornlamningar/admin/sites">
          <span className="fl-nav-title">Sites</span>
          <span className="fl-nav-note">
            Every published place, with photos, sources and ratings.
          </span>
        </Link>
        <Link className="fl-nav-card" href="/fornlamningar/admin/compare">
          <span className="fl-nav-title">Compare</span>
          <span className="fl-nav-note">
            Which of two places is more striking. Tie when they match, skip when
            you cannot tell.
          </span>
        </Link>
        <Link className="fl-nav-card" href="/fornlamningar/admin/flags">
          <span className="fl-nav-title">Flags</span>
          <span className="fl-nav-note">Notes on places that need a fix.</span>
        </Link>
        <Link className="fl-nav-card" href="/fornlamningar/admin/map">
          <span className="fl-nav-title">Map</span>
          <span className="fl-nav-note">Under construction.</span>
        </Link>
      </nav>
    </AdminGate>
  );
}
