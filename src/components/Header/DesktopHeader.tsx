import styled from "@emotion/styled";
import Link from "next/link";
import { useRouter } from "next/router";
import DarkModeSwitch from "./DarkModeSwitch";
import Logo from "./Logo";

const Wrapper = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.primary};
  padding-inline: ${({ theme }) => theme.spacing[4]};
  height: ${({ theme }) => theme.spacing.aLot};
`;

const Nav = styled.nav`
  & > ul {
    display: flex;
    list-style: none;
    gap: ${({ theme }) => theme.spacing[4]};
    margin: 0;
    padding: 0;
  }
`;

const NavLink = styled(Link)<{ active: 0 | 1 }>`
  color: ${({ theme }) => theme.colors.white};
  text-decoration: none;
  &:hover {
    color: ${({ theme }) => theme.colors.lightprimary};
  }
`;

function DesktopNav({
  navLinks,
}: {
  navLinks: { href: string; pageName: string }[];
}) {
  const { pathname } = useRouter();
  return (
    <Wrapper>
      <Logo />
      <Nav>
        <ul>
          {navLinks.map(({ href, pageName }) => (
            <li key={href}>
              <NavLink active={pathname === href ? 1 : 0} href={href}>
                {pageName}
              </NavLink>
            </li>
          ))}
        </ul>
      </Nav>
      <DarkModeSwitch />
    </Wrapper>
  );
}

export default DesktopNav;
