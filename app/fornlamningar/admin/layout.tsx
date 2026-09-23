import React from 'react';
import type { Metadata } from 'next';
import './admin.css';

/**
 * Its own layout, for two reasons.
 *
 * The parent layout gives the MAP the whole viewport -- `position: fixed`,
 * `overflow: hidden` -- which is right for a map and wrong for a list that
 * has to scroll. This puts a scrolling container back inside it.
 *
 * And `noindex`: a moderation page in a search index is an invitation, and
 * the endpoints behind it answer 404 rather than 403 for the same reason.
 * Nothing here is reachable without a token, but not being catalogued is
 * free.
 */
export const metadata: Metadata = {
  title: 'Moderation',
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fl-admin">
      <div className="fl-admin-inner">{children}</div>
    </div>
  );
}
