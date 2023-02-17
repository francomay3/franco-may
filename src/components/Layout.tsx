import Header from "./Header";
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
