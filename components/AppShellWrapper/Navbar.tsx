import { Flex, NavLink } from '@mantine/core';
import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/utils/constants';

const NavLinkItem = ({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) => {
  const pathName = usePathname();
  return (
    <NavLink
      href={href}
      label={label}
      leftSection={icon}
      active={pathName === href}
    />
  );
};

const Navbar = () => {
  return (
    <Flex direction="column">
      {Object.values(NAV_LINKS).map(link => (
        <NavLinkItem
          key={link.href}
          href={link.href}
          label={link.label}
          icon={link.icon}
        />
      ))}
    </Flex>
  );
};

export default Navbar;
