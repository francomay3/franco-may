import styled from "@emotion/styled";
import Link from "next/link";
import { useRouter } from "next/router";

const Wrapper = styled.nav`
  & > ul {
    display: flex;
    list-style: none;
    gap: ${({ theme }) => theme.spacing[4]};
    margin: 0;
    padding: 0;
  }
`;

const NavLink = styled(Link)<{ active: boolean }>`
  color: ${({ theme }) => theme.colors.white};
  text-decoration: none;
  &:hover {
    color: ${({ theme }) => theme.colors.lightGrey};
  }
  ${({ theme }) => theme.mobile} {
    display: none;
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
      <ul>
        {navLinks.map(({ href, pageName }) => (
          <li key={href}>
            <NavLink active={pathname === href} href={href}>
              {pageName}
            </NavLink>
          </li>
        ))}
      </ul>
    </Wrapper>
  );
}

export default DesktopNav;
