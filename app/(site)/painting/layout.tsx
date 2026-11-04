import React from 'react';
import { PaintingProvider } from './PaintingProvider';

// The provider sits in the layout so the sign-in and the library are kept
// while moving between the list and a tutorial. THE GATE IS IN THAT FILE.
export default function PaintingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PaintingProvider>{children}</PaintingProvider>;
}
