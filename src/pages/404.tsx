import styled from "@emotion/styled";
import Head from "next/head";

const Content = styled.div`
  margin-block: auto;
  text-align: center;
`;

const PageNotFound = () => {
  return (
    <>
      <Head>
        <title>Franco May - Page Not Found :(</title>
      </Head>
      <Content>
        <h1>Error 404</h1>
        <p>
          Whoops! Looks like this page doesn&apos;t exist. Please check the URL
          and try again.
        </p>
      </Content>
    </>
  );
};

export default PageNotFound;
