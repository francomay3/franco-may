import styled from "@emotion/styled";
import { Menu } from "@headlessui/react";
import Link from "next/link";
import Logo from "./Logo";
import DarkModeSwitch from "./DarkModeSwitch";
import Icon from "@/components/Icon";

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.darkGrey};
  padding-inline: ${({ theme }) => theme.spacing[4]};
  height: ${({ theme }) => theme.spacing.aLot};
`;

const Nav = styled.nav`
  display: none;
  ${({ theme }) => theme.mobile} {
    display: initial;
  }
`;

const Button = styled.button`
  display: flex;
  & > svg {
    color: ${({ theme }) => theme.colors.white};
    font-size: 1.8rem;
  }
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  outline: none;
  &:focus {
    outline: none;
  }
  order: 1;
`;

const Items = styled.div`
  width: 100vw;
  background-color: ${({ theme }) => theme.colors.darkGrey};
  display: flex;
  flex-direction: column;
  position: absolute;
  right: 0;
  top: ${({ theme }) => theme.spacing.aLot};
  padding: ${({ theme }) => theme.spacing[4]};
  padding-bottom: ${({ theme }) => theme.spacing[1]};
  &:focus {
    outline: none;
  }
`;

const Item = styled(Link)<{ active: boolean }>`
  padding-block: ${({ theme }) => theme.spacing[2]};
  text-decoration: none;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  border-block-start: 1px solid ${({ theme }) => theme.colors.grey};
  color: ${({ active, theme }) =>
    active ? theme.colors.grey : theme.colors.white};
`;

function MobileNav({
  navLinks,
}: {
  navLinks: { href: string; pageName: string }[];
}) {
  return (
    <Wrapper>
      <Menu as={Nav}>
        {({ open }) => (
          <>
            <Menu.Button as={Button}>
              {open ? <Icon id="x" /> : <Icon id="menu" />}
            </Menu.Button>

            <Menu.Items as={Items}>
              {navLinks.map(({ href, pageName }) => (
                <Menu.Item key={href}>
                  {({ active }) => (
                    <Item active={active} href={href}>
                      {pageName}
                    </Item>
                  )}
                </Menu.Item>
              ))}
            </Menu.Items>
          </>
        )}
      </Menu>
      <Logo />
      <DarkModeSwitch />
    </Wrapper>
  );
}

export default MobileNav;
