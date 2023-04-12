import Head from "next/head";
import Layout from "@/components/Layout";
import Home from "@/components/pages/home/Home";

const HomePage = () => {
  return (
    <Layout>
      <Head>
        <title>Franco May</title>
      </Head>
      <Home />
    </Layout>
  );
};

export default HomePage;
