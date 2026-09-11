import React from 'react';
import { AppShellWrapper } from '../../components/AppShellWrapper/AppShellWrapper';

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShellWrapper>{children}</AppShellWrapper>;
}
