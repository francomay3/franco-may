import {
  IconApps,
  IconLayoutGrid,
  IconBrandYoutube,
  IconBuilding,
  IconChartDots,
  IconColorSwatch,
  IconGridDots,
  IconSwords,
  IconHome2,
  IconMail,
  IconMoodSmile,
  IconPalette,
} from '@tabler/icons-react';

export type NavLink = {
  label: string;
  href: string;
  /** Pages under this path also count as being on this link. */
  match?: string;
  icon: React.ReactNode;
};

/** Links shown together under one name, expanded on demand. */
export type NavGroup = {
  label: string;
  icon: React.ReactNode;
  children: NavLink[];
};

export type NavItem = NavLink | NavGroup;

export const isNavGroup = (item: NavItem): item is NavGroup =>
  'children' in item;

/** Whether the page at `pathName` is this link, or inside this group. */
export function isNavActive(item: NavItem, pathName: string): boolean {
  if (isNavGroup(item)) {
    return item.children.some(child => isNavActive(child, pathName));
  }
  return item.match
    ? pathName === item.match || pathName.startsWith(`${item.match}/`)
    : pathName === item.href;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: <IconHome2 size={16} stroke={1.5} />,
  },
  {
    label: 'Contact',
    href: '/contact',
    icon: <IconMail size={16} stroke={1.5} />,
  },
  {
    label: 'Portfolio',
    icon: <IconApps size={16} stroke={1.5} />,
    children: [
      {
        label: 'Overview',
        href: '/portfolio',
        icon: <IconLayoutGrid size={16} stroke={1.5} />,
      },
      {
        label: 'Historia Kartan',
        href: '/fornlamningar/map',
        match: '/fornlamningar',
        icon: <IconBuilding size={16} stroke={1.5} />,
      },
      {
        label: 'Life satisfaction',
        href: '/life-satisfaction',
        icon: <IconMoodSmile size={16} stroke={1.5} />,
      },
      {
        label: 'HackerTube',
        href: '/hackertube',
        match: '/hackertube',
        icon: <IconBrandYoutube size={16} stroke={1.5} />,
      },
      {
        label: 'Gravity Grid',
        href: '/gravity',
        icon: <IconChartDots size={16} stroke={1.5} />,
      },
      {
        label: 'Sudoku',
        href: '/sudoku',
        icon: <IconGridDots size={16} stroke={1.5} />,
      },
      {
        label: 'Name duels',
        href: '/duel',
        icon: <IconSwords size={16} stroke={1.5} />,
      },
      {
        label: 'Impasto',
        href: '/impasto',
        icon: <IconColorSwatch size={16} stroke={1.5} />,
      },
      {
        label: 'Painting',
        href: '/painting',
        match: '/painting',
        icon: <IconPalette size={16} stroke={1.5} />,
      },
    ],
  },
];

export const SITE_CONFIG = {
  name: 'Franco May',
  url: 'https://franco-may.com',
  description: 'Thoughts on technology, philosophy and everything else',
  author: 'Franco May',
  language: 'en',
  rssUrl: 'https://franco-may.com/rss.xml',
} as const;
