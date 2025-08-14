'use client';

import { Breadcrumbs as MantineBreadcrumbs, Text } from '@mantine/core';
import { usePathname } from 'next/navigation';
import React from 'react';
import Link from './Link';

interface BreadcrumbItem {
  title: string;
  href?: string;
}

const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Inicio', href: '/' }];

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
    <MantineBreadcrumbs>
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {item.href ? (
            <Link href={item.href}>{item.title}</Link>
          ) : (
            <Text c="dimmed">{item.title}</Text>
          )}
        </React.Fragment>
      ))}
    </MantineBreadcrumbs>
  );
};

export default Breadcrumbs;
