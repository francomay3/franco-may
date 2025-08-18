'use client';

import {
  BoxProps,
  Burger,
  Flex,
  FloatingIndicator,
  Title,
} from '@mantine/core';
import { ColorSchemeIcon } from './ColorSchemeIcon';
import { NAV_LINKS } from '@/utils/constants';
import Link from '../Link';
import Glass from '../Glass';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const NavLinks = (
  props: BoxProps & {
    visibleFrom: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  }
) => {
  const pathName = usePathname();

  const [controlsRefs, setControlsRefs] = useState<
    Record<string, HTMLAnchorElement>
  >({});

  const [active, setActive] = useState(
    Object.values(NAV_LINKS).findIndex(link => link.href === pathName)
  );

  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);

  // Update active state when pathname changes
  useEffect(() => {
    const newActiveIndex = Object.values(NAV_LINKS).findIndex(
      link => link.href === pathName
    );
    if (newActiveIndex !== -1) {
      setActive(newActiveIndex);
    }
  }, [pathName]);

  const setControlRef = (index: number) => (node: HTMLAnchorElement) => {
    controlsRefs[index] = node;
    setControlsRefs(controlsRefs);
  };
  return (
    <>
      <Flex {...props} ref={setRootRef} pos="relative">
        {Object.values(NAV_LINKS).map((link, index) => (
          <Link
            key={link.href}
            href={link.href}
            ref={setControlRef(index)}
            onClick={() => setActive(index)}
            px="10"
            py="2"
            ff="var(--mantine-font-family-headings)"
          >
            {link.label}
          </Link>
        ))}
        <FloatingIndicator
          target={controlsRefs[active]}
          parent={rootRef}
          style={{
            backgroundColor: 'var(--mantine-color-anchor)',
            borderRadius: 'var(--mantine-radius-default)',
            zIndex: 1,
            mixBlendMode: 'overlay',
            opacity: 0.6,
          }}
        />
      </Flex>
    </>
  );
};

const Header = ({
  navbarOpened,
  toggleNavbar,
}: {
  navbarOpened: boolean;
  toggleNavbar: () => void;
}) => {
  return (
    <Glass>
      <Flex justify="space-between" align="center" h="100%" p="md">
        <Burger
          opened={navbarOpened}
          onClick={toggleNavbar}
          hiddenFrom="sm"
          size="sm"
        />
        <NavLinks visibleFrom="sm" />
        <Link href="/" c="inherit">
          <Title
            order={5}
            ta="center"
            pos="absolute"
            top="50%"
            left="50%"
            style={{
              transform: 'translate(-50%, -50%)',
            }}
          >
            Franco May
          </Title>
        </Link>
        <ColorSchemeIcon />
      </Flex>
    </Glass>
  );
};

export default Header;
