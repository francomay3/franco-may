'use client';

import React from 'react';
import Link from 'next/link';
import { ActionIcon, Avatar, Menu } from '@mantine/core';
import {
  IconBookmark,
  IconBookmarks,
  IconHome2,
  IconLogout,
} from '@tabler/icons-react';
import { signOut, type User } from 'firebase/auth';
import { auth } from './firebase';
import styles from './hackertube.module.css';

/** The "For you" home. */
export const LIST_HREF = '/hackertube';
export const ADVANCED_HREF = '/hackertube/search';
export const LIKED_HREF = '/hackertube/liked';
export const WATCH_LATER_HREF = '/hackertube/watch-later';
export const SAVED_SEARCHES_HREF = '/hackertube/search?tab=saved';

/** Back to the rest of the site. */
export function HomeLink() {
  return (
    <ActionIcon
      component={Link}
      href="/"
      variant="subtle"
      color="gray"
      aria-label="Back to franco-may.com"
      title="Back to franco-may.com"
    >
      <IconHome2 size={18} />
    </ActionIcon>
  );
}

export function BrandLink() {
  return (
    <>
      <HomeLink />
      <Link
        href={LIST_HREF}
        className={styles.brand}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        Hacker<span>Tube</span>
      </Link>
    </>
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
          component={Link}
          href={WATCH_LATER_HREF}
          leftSection={<IconBookmark size={14} />}
        >
          Watch later
        </Menu.Item>
        <Menu.Item
          component={Link}
          href={SAVED_SEARCHES_HREF}
          leftSection={<IconBookmarks size={14} />}
        >
          Saved searches
        </Menu.Item>
        <Menu.Divider />
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
