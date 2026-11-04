'use client';

import {
  Anchor,
  BoxProps,
  Burger,
  Flex,
  FloatingIndicator,
  Menu,
  Title,
} from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import NextLink from 'next/link';
import { ColorSchemeIcon } from './ColorSchemeIcon';
import {
  NAV_ITEMS,
  type NavGroup,
  isNavActive,
  isNavGroup,
} from '@/utils/constants';
import Link from '../Link';
import Glass from '../Glass';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** "Portfolio", or "Portfolio · Painting" when on one of its pages. */
const groupLabel = (group: NavGroup, pathName: string) => {
  const current = group.children.find(child => isNavActive(child, pathName));
  return current ? `${group.label} · ${current.label}` : group.label;
};

const NavLinks = (
  props: BoxProps & {
    visibleFrom: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  }
) => {
  const pathName = usePathname();

  const [controlsRefs, setControlsRefs] = useState<Record<string, HTMLElement>>(
    {}
  );

  const [active, setActive] = useState(
    NAV_ITEMS.findIndex(item => isNavActive(item, pathName))
  );

  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);

  // Update active state when pathname changes
  useEffect(() => {
    const newActiveIndex = NAV_ITEMS.findIndex(item =>
      isNavActive(item, pathName)
    );
    if (newActiveIndex !== -1) {
      setActive(newActiveIndex);
    }
  }, [pathName]);

  const setControlRef = (index: number) => (node: HTMLElement | null) => {
    if (node) {
      controlsRefs[index] = node;
      setControlsRefs(controlsRefs);
    }
  };
  return (
    <>
      <Flex {...props} ref={setRootRef} pos="relative">
        {NAV_ITEMS.map((item, index) =>
          isNavGroup(item) ? (
            <Menu key={item.label} position="bottom-start" withinPortal>
              <Menu.Target>
                <Anchor
                  component="button"
                  type="button"
                  ref={setControlRef(index)}
                  px="10"
                  py="2"
                  ff="var(--mantine-font-family-headings)"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'none',
                    border: 0,
                    font: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  {groupLabel(item, pathName)}
                  <IconChevronDown size={14} />
                </Anchor>
              </Menu.Target>
              <Menu.Dropdown>
                {item.children.map(child => (
                  <Menu.Item
                    key={child.href}
                    component={NextLink}
                    href={child.href}
                    leftSection={child.icon}
                  >
                    {child.label}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              ref={setControlRef(index)}
              onClick={() => setActive(index)}
              px="10"
              py="2"
              ff="var(--mantine-font-family-headings)"
            >
              {item.label}
            </Link>
          )
        )}
        <FloatingIndicator
          target={controlsRefs[active]}
          parent={rootRef}
          style={{
            backgroundColor: 'var(--mantine-color-anchor)',
            borderRadius: 'var(--mantine-radius-default)',
            zIndex: 1,
            // The indicator sits over the active item; without this it eats the
            // click, and an active group (Portfolio) could not be opened.
            pointerEvents: 'none',
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
            🪐 Franco May
          </Title>
        </Link>
        <ColorSchemeIcon />
      </Flex>
    </Glass>
  );
};

export default Header;
