import React from "react";
import Head from "next/head";
import DevDesignSystem from "@/components/pages/dev-design-system/DevDesignSystem";
import Layout from "@/components/Layout";

const DevDesignSystemPage = () => {
  return (
    <Layout>
      <Head>
        <title>Franco May - Dev Design System</title>
      </Head>
      <DevDesignSystem />
    </Layout>
  );
};

export default DevDesignSystemPage;
