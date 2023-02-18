import Layout from "@/components/Layout";
import styled from "@emotion/styled";

const Content = styled.div`
  margin-block: auto;
  text-align: center;
`;

const PageNotFound = () => {
  return (
    <Layout>
      <Content>
        <h1>Error 404</h1>
        <p>
          Whoops! Looks like this page doesn&apos;t exist. Please check the URL
          and try again.
        </p>
      </Content>
    </Layout>
  );
};

export default PageNotFound;
