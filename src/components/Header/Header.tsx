import MobileHeader from "./MobileHeader";
import DesktopHeader from "./DesktopHeader";
import Media from "react-media";
import { mobile } from "@/providers/Theme";

const navLinks = [
  { href: "/", pageName: "Home" },
  { href: "/about", pageName: "About" },
  { href: "/blog", pageName: "Blog" },
  { href: "/contact", pageName: "Contact" },
];

const Header = () => {
  return (
    <Media query={mobile}>
      {(matches) => {
        return matches ? (
          <MobileHeader navLinks={navLinks} />
        ) : (
          <DesktopHeader navLinks={navLinks} />
        );
      }}
    </Media>
  );
};

export default Header;
