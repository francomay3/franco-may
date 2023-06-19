import styled from "@emotion/styled";
import { CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import { useDarkMode } from "@/providers/theme/Theme";

const Wrapper = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
  *::selection {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.background};
  }
`;

const Container = styled.div`
  margin-top: ${({ theme }) => theme.header.width};
  align-items: center;
  flex-direction: column;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.background};
  padding-block: 1.5rem;
  padding-inline: 8rem;
  ${({ theme }) => theme.mediaQueries.onlyTablet} {
    padding-inline: 3rem;
  }
  ${({ theme }) => theme.mediaQueries.onlyMobile} {
    ${({ theme }) =>
      !theme.isDark && `background-color: ${theme.colors.white}`};
    padding-inline: 1rem;
  }
`;

const Sticky = styled.div`
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1;
`;

const Layout = ({
  children,
  WrapperStyles,
}: {
  children: React.ReactNode;
  WrapperStyles?: CSSProperties;
}) => {
  const { isDark } = useDarkMode();
  return (
    <>
      <Sticky>
        <Header />
      </Sticky>
      <AnimatePresence mode="wait">
        <Wrapper
          animate={{ filter: "blur(0px)", opacity: 1 }}
          initial={{ filter: "blur(2px)", opacity: 0 }}
          key={isDark ? "dark" : "light"}
          style={WrapperStyles}
          transition={{ duration: 0.3 }}
        >
          <Container>{children}</Container>
          <Footer />
        </Wrapper>
      </AnimatePresence>
    </>
  );
};

export default Layout;
