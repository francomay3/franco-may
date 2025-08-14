'use client';

import { BoxProps, Burger, Flex, Title } from '@mantine/core';
import { ColorSchemeIcon } from './ColorSchemeIcon';
import { NAV_LINKS } from '@/utils/constants';
import Link from '../Link';

const NavLinks = (
  props: BoxProps & { visibleFrom: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }
) => {
  return (
    <Flex {...props} gap="md">
      {Object.values(NAV_LINKS).map(link => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </Flex>
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
  );
};

export default Header;
