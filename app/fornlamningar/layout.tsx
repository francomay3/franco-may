import React from 'react';

// The map owns the whole viewport: no header, no footer, no padding. Rendered
// outside the (site) route group so it never gets the AppShell chrome.
export default function FornlamningarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
