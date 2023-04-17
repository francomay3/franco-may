import styled from "@emotion/styled";
import Link from "next/link";
import { useRouter } from "next/router";
import DarkModeSwitch from "./DarkModeSwitch";
import Logo from "./Logo";
import { useAuth } from "@/providers/AuthProvider";

const Wrapper = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }) => theme.header.backgroundColor};
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
    align-items: center;
    & a,
    & p {
      cursor: pointer;
      color: ${({ theme }) => theme.colors.white};
      text-decoration: none;
      &:hover {
        color: ${({ theme }) => theme.colors.lightprimary};
      }
    }
  }
`;

function DesktopNav({
  navLinks,
}: {
  navLinks: { href: string; pageName: string }[];
}) {
  const { isAdmin, setIsEditing, isEditing } = useAuth();
  return (
    <Wrapper>
      <Logo />
      <Nav>
        <ul>
          {navLinks.map(({ href, pageName }) => (
            <li key={href}>
              <Link href={href}>{pageName}</Link>
            </li>
          ))}
          {isAdmin && (
            <li>
              <p onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? "Don't edit" : "edit"}
              </p>
            </li>
          )}
        </ul>
      </Nav>
      <DarkModeSwitch />
    </Wrapper>
  );
}

export default DesktopNav;
