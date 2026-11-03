import { Flex, NavLink } from '@mantine/core';
import { usePathname } from 'next/navigation';
import {
  NAV_ITEMS,
  type NavLink as NavLinkData,
  isNavActive,
  isNavGroup,
} from '@/utils/constants';
import Link from 'next/link';
import Glass from '../Glass';

const NavLinkItem = ({
  link,
  onSelect,
}: {
  link: NavLinkData;
  onSelect?: (href: string) => void;
}) => {
  const pathName = usePathname();
  return (
    <NavLink
      href={link.href}
      label={link.label}
      leftSection={link.icon}
      active={isNavActive(link, pathName)}
      component={Link}
      onClick={() => {
        onSelect?.(link.href);
      }}
    />
  );
};

const Navbar = ({ onClose }: { onClose: () => void }) => {
  const pathName = usePathname();
  return (
    <Glass>
      <Flex direction="column">
        {NAV_ITEMS.map(item =>
          isNavGroup(item) ? (
            <NavLink
              key={item.label}
              label={item.label}
              leftSection={item.icon}
              childrenOffset={28}
              defaultOpened={isNavActive(item, pathName)}
            >
              {item.children.map(child => (
                <NavLinkItem key={child.href} link={child} onSelect={onClose} />
              ))}
            </NavLink>
          ) : (
            <NavLinkItem key={item.href} link={item} onSelect={onClose} />
          )
        )}
      </Flex>
    </Glass>
  );
};

export default Navbar;
