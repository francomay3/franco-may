import { NAV_LINKS } from '@/app/utils/constants';
import { Flex, NavLink } from '@mantine/core';
import { IconHome2, IconBook, IconMail } from '@tabler/icons-react';

const Navbar = () => {
  return (
    <Flex direction="column">
      <NavLink
        href={NAV_LINKS.home.href}
        label={NAV_LINKS.home.label}
        leftSection={<IconHome2 size={16} stroke={1.5} />}
      />
      <NavLink
        href={NAV_LINKS.blog.href}
        label={NAV_LINKS.blog.label}
        leftSection={<IconBook size={16} stroke={1.5} />}
      />
      <NavLink
        href={NAV_LINKS.contact.href}
        label={NAV_LINKS.contact.label}
        leftSection={<IconMail size={16} stroke={1.5} />}
      />
    </Flex>
  );
};

export default Navbar;
