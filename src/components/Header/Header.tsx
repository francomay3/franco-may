import MobileHeader from "./MobileHeader";
import DesktopHeader from "./DesktopHeader";
import { useIsMobile } from "@/hooks/useIsMobile";

const navLinks = [
  { href: "/", pageName: "About" },
  { href: "/blog", pageName: "Blog" },
  { href: "/contact", pageName: "Contact" },
];

const Header = () => {
  const isMobile = useIsMobile();
  return isMobile ? (
    <MobileHeader navLinks={navLinks} />
  ) : (
    <DesktopHeader navLinks={navLinks} />
  );
};

export default Header;
