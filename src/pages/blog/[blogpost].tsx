import Head from "next/head";
import Layout from "@/components/Layout";
import { getPost } from "@/utils/postUtils";
import Post from "@/components/pages/post/Post";
import { PostFields } from "@/utils/types";
import { TITLE } from "@/utils/constants";

export async function getServerSideProps(context: {
  params: { blogpost: any };
}) {
  const id = context.params.blogpost;
  const post = await getPost(id);

  return post
    ? {
        props: {
          ...post,
        },
      }
    : { notFound: true };
}

const BlogPost = (props: PostFields) => {
  return (
    <Layout>
      <Head>
        <title>Franco May - {props[TITLE]}</title>
      </Head>
      <Post {...props} />
    </Layout>
  );
};

export default BlogPost;
