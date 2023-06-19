import styled from "@emotion/styled";
import Link from "next/link";
import DarkModeSwitch from "./DarkModeSwitch";
import Logo from "./Logo";
import { useAuth } from "@/providers/AuthProvider";

const Nav = styled.nav`
  & > ul {
    align-items: center;
    display: flex;
    gap: 1rem;
    list-style: none;
    margin: 0;
    padding: 0;
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
    <>
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
                {isEditing ? "Stop editing" : "edit"}
              </p>
            </li>
          )}
        </ul>
      </Nav>
      <DarkModeSwitch />
    </>
  );
}

export default DesktopNav;
