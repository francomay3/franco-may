import styled from "@emotion/styled";
import MobileNav from "./MobileNav";
import DesktopNav from "./DesktopNav";
import DarkModeSwitch from "./DarkModeSwitch";

const HeaderWrapper = styled.header`
  background-color: ${({ theme }) => theme.colors.darkGrey};
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-inline: ${({ theme }) => theme.spacing[4]};
  height: ${({ theme }) => theme.spacing.aLot};
`;

const Logo = styled.h1`
  color: ${({ theme }) => theme.colors.white};
  line-height: 0;
  ${({ theme }) => theme.mobile} {
    order: 2;
  }
`;

const navLinks = [
  { href: "/", pageName: "Home" },
  { href: "/about", pageName: "About" },
  { href: "/blog", pageName: "Blog" },
  { href: "/contact", pageName: "Contact" },
];

const Header = () => {
  return (
    <HeaderWrapper>
      <Logo>Franco May</Logo>
      <DesktopNav navLinks={navLinks} />
      <MobileNav navLinks={navLinks} />
      <DarkModeSwitch />
    </HeaderWrapper>
  );
};

export default Header;
