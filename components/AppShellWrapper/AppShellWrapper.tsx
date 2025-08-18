'use client';

import React from 'react';
import { AppShell, Container } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Navbar from './Navbar';
import Header from './Header';
import Footer from './Footer';

interface AppShellWrapperProps {
  children: React.ReactNode;
}

export function AppShellWrapper({ children }: AppShellWrapperProps) {
  const [navbarOpened, { toggle: toggleNavbar, close: closeNavbar }] =
    useDisclosure(false);

  return (
    <AppShell
      styles={{
        header: {
          backgroundColor: 'transparent',
        },
        navbar: {
          backgroundColor: 'transparent',
        },
      }}
      header={{ height: 60, offset: true }}
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
        <Navbar onClose={closeNavbar} />
      </AppShell.Navbar>

      <AppShell.Main
        styles={{
          main: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'space-between',
          },
        }}
      >
        <Container mb="30" w="100%">
          {children}
        </Container>
        <Footer />
      </AppShell.Main>
    </AppShell>
  );
}
