import styled from "@emotion/styled";
import { AnimatePresence, motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import { useDarkMode } from "@/providers/theme/Theme";

const Wrapper = styled(motion.div)`
  display: grid;
  grid-template-areas:
    "left-bar main right-bar"
    "footer footer footer";
  grid-template-columns:
    1fr minmax(${({ theme }) => theme.breakpoints.tablet}px, 3fr)
    1fr;
  grid-template-rows: 1fr auto;
  min-height: 100vh;
  width: 100vw;

  ${({ theme }) => theme.mediaQueries.onlyMobile} {
    grid-template-areas:
      "main"
      "footer";
    grid-template-columns: 1fr;
  }

  main {
    grid-area: main;
    margin-top: 3rem;
    padding-block: 3rem;
    padding-inline: 1rem;
    ${({ theme }) => theme.mediaQueries.mobileAndTablet} {
      width: 100vw;
    }
    ${({ theme }) => theme.mediaQueries.onlyMobile} {
      padding-block: 1rem;
    }
    ${({ theme }) => theme.mediaQueries.onlyTablet} {
      padding-block: 1.5rem;
    }
  }

  footer {
    width: 100vw;
    grid-area: footer;
  }
`;

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isDark } = useDarkMode();

  const motionProps = {
    animate: { filter: "blur(0px)", opacity: 1 },
    initial: { filter: "blur(2px)", opacity: 0 },
    transition: { duration: 0.3 },
    key: isDark ? "dark" : "light",
  };

  return (
    <AnimatePresence mode="wait">

      <Header />
      <Wrapper
        {...motionProps}
      >
        <main>{children}</main>
        <footer>
          <Footer />
        </footer>
      </Wrapper>
    </AnimatePresence>
  );
};

export default Layout;
