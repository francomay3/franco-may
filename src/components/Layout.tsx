import Header from "./Header/Header";
import Footer from "./Footer";
import styled from "@emotion/styled";

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

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Wrapper>
      <Header />
      <Main>{children}</Main>
      <Footer />
    </Wrapper>
  );
};

export default Layout;
