import Layout from "@/components/Layout";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
const PostEditor = dynamic(() => import("@/components/blog-page/PostEditor"), {
  ssr: false,
});

function edit() {
  const router = useRouter();
  return (
    <Layout
      contentStyles={{ alignItems: "stretch", justifyContent: "flex-start" }}
    >
      <PostEditor id={router.query.blogpost} />
    </Layout>
  );
}

export default edit;
