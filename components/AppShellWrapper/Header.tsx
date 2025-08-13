'use client';

import { Burger, Flex, Text } from '@mantine/core';
import { ColorSchemeIcon } from './ColorSchemeIcon';

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
      <Text>Franco May</Text>
      <ColorSchemeIcon />
    </Flex>
  );
};

export default Header;
