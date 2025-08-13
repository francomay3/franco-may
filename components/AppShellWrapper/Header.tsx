import { Burger, Flex, Text } from '@mantine/core';

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
    </Flex>
  );
};

export default Header;
