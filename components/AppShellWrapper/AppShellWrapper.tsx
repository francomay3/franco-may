'use client';

import React from 'react';
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Navbar from './Navbar';
import Header from './Header';

interface AppShellWrapperProps {
  children: React.ReactNode;
}

export function AppShellWrapper({ children }: AppShellWrapperProps) {
  const [navbarOpened, { toggle: toggleNavbar }] = useDisclosure(false);

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !navbarOpened, desktop: true },
      }}
    >
      <AppShell.Header>
        <Header navbarOpened={navbarOpened} toggleNavbar={toggleNavbar} />
      </AppShell.Header>

      <AppShell.Navbar>
        <Navbar />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
