'use client';

import { Breadcrumbs as MantineBreadcrumbs, Anchor, Text } from '@mantine/core';
import { usePathname } from 'next/navigation';
import React from 'react';

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

      // Convertir el segmento a un título legible
      const title = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // El último item no tiene href (es la página actual)
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
            <Anchor href={item.href}>{item.title}</Anchor>
          ) : (
            <Text c="dimmed" mb="0">
              {item.title}
            </Text>
          )}
        </React.Fragment>
      ))}
    </MantineBreadcrumbs>
  );
};

export default Breadcrumbs;
