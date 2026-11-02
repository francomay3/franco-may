'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar, Menu } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { signOut, type User } from 'firebase/auth';
import { auth } from './firebase';
import styles from './hackertube.module.css';

export const LIST_HREF = '/hackertube';

export function BrandLink() {
  return (
    <Link
      href={LIST_HREF}
      className={styles.brand}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      Hacker<span>Tube</span>
    </Link>
  );
}

export function UserMenu({ user }: { user: User }) {
  return (
    <Menu position="bottom-end" withArrow>
      <Menu.Target>
        <Avatar
          src={user.photoURL}
          alt={user.displayName ?? ''}
          radius="xl"
          size={32}
          style={{ cursor: 'pointer' }}
        >
          {user.displayName?.[0]}
        </Avatar>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{user.email}</Menu.Label>
        <Menu.Item
          leftSection={<IconLogout size={14} />}
          onClick={() => signOut(auth)}
        >
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

/** The header the video and channel pages use: just the way home and you. */
export function SimpleHeader({ user }: { user: User }) {
  return (
    <header className={styles.header}>
      <BrandLink />
      <div style={{ flex: 1 }} />
      <UserMenu user={user} />
    </header>
  );
}
