import { AnimatePresence, motion } from "framer-motion";
import styled from "@emotion/styled";
import MobileHeader from "./MobileHeader";
import DesktopHeader from "./DesktopHeader";
import { useIsMobile } from "@/hooks/useIsMobile";

const navLinks = [
  { href: "/", pageName: "About" },
  { href: "/blog", pageName: "Blog" },
  { href: "/contact", pageName: "Contact" },
];

const Wrapper = styled(motion.div)`
  align-items: center;
  background-color: ${({ theme }) => theme.header.backgroundColor};
  display: flex;
  height: ${({ theme }) => theme.header.width};
  justify-content: space-between;
  padding-inline: 1rem;
  z-index: 2;
`;

const Header = () => {
  const isMobile = useIsMobile();
  return (
    <AnimatePresence>
      {isMobile ? (
        <Wrapper animate={{ opacity: 1 }} initial={{ opacity: 0 }}>
          <MobileHeader navLinks={navLinks} />
        </Wrapper>
      ) : (
        <Wrapper animate={{ opacity: 1 }} initial={{ opacity: 0 }}>
          <DesktopHeader navLinks={navLinks} />
        </Wrapper>
      )}
    </AnimatePresence>
  );
};

export default Header;
