import React from 'react';

/**
 * A scrolling page inside the map's fullscreen layout.
 *
 * Same reason as the admin layout: the parent gives the map the whole
 * viewport with `overflow: hidden`, which is right for a map and wrong for a
 * page of text.
 *
 * These pages live under /fornlamningar rather than in the (site) route group
 * because the app links to them from inside itself. A person reading them
 * arrived from a phone, not from the blog, and the site chrome would offer
 * them a personal homepage they did not ask for.
 */
export default function TextLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1.25rem' }}>
        {children}
      </div>
    </div>
  );
}
