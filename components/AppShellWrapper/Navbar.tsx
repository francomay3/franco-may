import { Flex, NavLink } from '@mantine/core';
import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/utils/constants';
import Link from 'next/link';
import Glass from '../Glass';

const NavLinkItem = ({
  href,
  label,
  icon,
  onSelect,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  onSelect?: (href: string) => void;
}) => {
  const pathName = usePathname();
  return (
    <NavLink
      href={href}
      label={label}
      leftSection={icon}
      active={pathName === href}
      component={Link}
      onClick={() => {
        onSelect?.(href);
      }}
    />
  );
};

const Navbar = ({ onClose }: { onClose: () => void }) => {
  return (
    <Glass>
      <Flex direction="column">
        {Object.values(NAV_LINKS).map(link => (
          <NavLinkItem
            key={link.href}
            href={link.href}
            label={link.label}
            icon={link.icon}
            onSelect={onClose}
          />
        ))}
      </Flex>
    </Glass>
  );
};

export default Navbar;
