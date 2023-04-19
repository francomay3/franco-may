import styled from "@emotion/styled";
import { CSSProperties } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Card } from "./design-system";
import { useDarkMode } from "@/providers/theme/Theme";
import { useIsMobile } from "@/hooks/useIsMobile";

const Wrapper = styled.div`
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
  align-items: center;
  flex-direction: column;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.background};
  padding-block: ${({ theme }) => theme.spacing[6]};
  padding-inline: ${({ theme }) => theme.spacing.aWholeLot};
  ${({ theme }) => theme.mediaQueries.tablet} {
    padding-inline: ${({ theme }) => theme.spacing.aLot};
  }
  ${({ theme }) => theme.mediaQueries.mobile} {
    ${({ theme }) =>
      !theme.isDark && `background-color: ${theme.colors.white}`};
    padding-inline: ${({ theme }) => theme.spacing[4]};
  }
`;

const Layout = ({
  children,
  WrapperStyles,
}: {
  children: React.ReactNode;
  WrapperStyles?: CSSProperties;
}) => {
  const { isDark } = useDarkMode();
  const isMobile = useIsMobile();
  const shouldRenderCard = !isMobile && !isDark;

  return (
    <Wrapper style={WrapperStyles}>
      <Header />
      <Container>
        {!shouldRenderCard ? (
          children
        ) : (
          <Card
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              maxWidth: "1000px",
            }}
          >
            {children}
          </Card>
        )}
      </Container>
      <Footer />
    </Wrapper>
  );
};

export default Layout;
