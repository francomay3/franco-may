import MobileHeader from "./MobileHeader";
import DesktopHeader from "./DesktopHeader";
import { useIsMobile } from "@/hooks/useIsMobile";

const navLinks = [
  { href: "/", pageName: "Home" },
  { href: "/about", pageName: "About" },
  { href: "/blog", pageName: "Blog" },
  { href: "/contact", pageName: "Contact" },
];

const Header = () =>
  useIsMobile() ? (
    <MobileHeader navLinks={navLinks} />
  ) : (
    <DesktopHeader navLinks={navLinks} />
  );

export default Header;
