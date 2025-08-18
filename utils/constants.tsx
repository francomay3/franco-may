import { IconBook, IconHome2, IconMail } from '@tabler/icons-react';

type NavLink = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

export const NAV_LINKS: Record<string, NavLink> = {
  home: {
    label: 'Home',
    href: '/',
    icon: <IconHome2 size={16} stroke={1.5} />,
  },
  blog: {
    label: 'Blog',
    href: '/blog',
    icon: <IconBook size={16} stroke={1.5} />,
  },
  contact: {
    label: 'Contact',
    href: '/contact',
    icon: <IconMail size={16} stroke={1.5} />,
  },
};

// Site configuration
export const SITE_CONFIG = {
  name: 'Franco May',
  url: 'https://franco-may.com',
  description: 'Thoughts on technology, philosophy and everything else',
  author: 'Franco May',
  language: 'en',
  rssUrl: 'https://franco-may.com/rss.xml',
} as const;
