import styled from "@emotion/styled";
import { AnimatePresence, motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import { useDarkMode } from "@/providers/theme/Theme";

const Wrapper = styled(motion.div)`
  display: grid;
  grid-template-areas:
    "header header header"
    "left-bar main right-bar"
    "footer footer footer";
  grid-template-columns:
    1fr minmax(${({ theme }) => theme.breakpoints.tablet}px, 3fr)
    1fr;
  grid-template-rows: 3rem 1fr auto;
  min-height: 100vh;
  width: 100vw;

  ${({ theme }) => theme.mediaQueries.onlyMobile} {
    grid-template-areas:
      "header"
      "main"
      "footer";
    grid-template-columns: 1fr;
  }

  header {
    grid-area: header;
    position: fixed;
    top: 0;
    width: 100vw;
    z-index: 1;
  }

  main {
    grid-area: main;
    margin-block: 3rem;
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

  return (
    <AnimatePresence mode="wait">
      <Wrapper
        animate={{ filter: "blur(0px)", opacity: 1 }}
        initial={{ filter: "blur(2px)", opacity: 0 }}
        key={isDark ? "dark" : "light"}
        transition={{ duration: 0.3 }}
      >
        <header>
          <Header />
        </header>
        <main>{children}</main>
        <footer>
          <Footer />
        </footer>
      </Wrapper>
    </AnimatePresence>
  );
};

export default Layout;
