'use client';

import { Breadcrumbs as MantineBreadcrumbs, Text } from '@mantine/core';
import { usePathname } from 'next/navigation';
import React from 'react';
import Link from './Link';
import styles from './Breadcrumbs.module.css';

interface BreadcrumbItem {
  title: string;
  href?: string;
}

const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      const title = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const href = index === pathSegments.length - 1 ? undefined : currentPath;

      breadcrumbs.push({ title, href });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = generateBreadcrumbs();

  return (
    <MantineBreadcrumbs
      classNames={{
        root: styles.breadcrumbs,
        separator: styles.separator,
        breadcrumb: styles.breadcrumb,
      }}
    >
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {item.href ? (
            <Link ff="var(--mantine-font-family-headings)" href={item.href}>
              {item.title}
            </Link>
          ) : (
            <Text c="dimmed" truncate>
              {item.title}
            </Text>
          )}
        </React.Fragment>
      ))}
    </MantineBreadcrumbs>
  );
};

export default Breadcrumbs;
