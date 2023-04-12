import Head from "next/head";
import Layout from "@/components/Layout";
import Contact from "@/components/pages/contact/Contact";

const ContactPage = () => {
  return (
    <Layout>
      <Head>
        <title>Franco May - Contact</title>
      </Head>
      <Contact />
    </Layout>
  );
};

export default ContactPage;
