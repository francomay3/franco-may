import Head from "next/head";
import Layout from "@/components/Layout";
import Admin from "@/components/pages/admin/Admin";

const AdminPage = () => {
  return (
    <Layout>
      <Head>
        <title>Franco May - Admin DashBoard</title>
      </Head>
      <Admin />
    </Layout>
  );
};

export default AdminPage;
