import Header from "./Header/Header";
import Footer from "./Footer";
import styled from "@emotion/styled";
import { CSSProperties } from "react";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
`;

const Main = styled.main`
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.white};
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding-block: ${({ theme }) => theme.spacing[6]};
  padding-inline: ${({ theme }) => theme.spacing.aWholeLot};
  ${({ theme }) => theme.tablet} {
    padding-inline: ${({ theme }) => theme.spacing.aLot};
  }
  ${({ theme }) => theme.mobile} {
    padding-inline: ${({ theme }) => theme.spacing.aBit};
  }
`;

const Layout = ({
  children,
  contentStyles,
  WrapperStyles,
}: {
  children: React.ReactNode;
  contentStyles?: CSSProperties;
  WrapperStyles?: CSSProperties;
}) => {
  return (
    <Wrapper style={WrapperStyles}>
      <Header />
      <Main style={contentStyles}>{children}</Main>
      <Footer />
    </Wrapper>
  );
};

export default Layout;
