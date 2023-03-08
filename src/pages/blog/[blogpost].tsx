import Layout from "@/components/Layout";
import { getPost } from "@/utils/postUtils";
import Post from "@/components/blog-page/Post";
import { CONTENT, TAGS } from "@/utils/constants";
import { memo } from "react";

export async function getServerSideProps(context: {
  params: { blogpost: any };
}) {
  const id = context.params.blogpost;
  const post = await getPost(id);

  return post
    ? {
        props: {
          ...post,
          [TAGS]: JSON.parse(post.tags),
          [CONTENT]: JSON.parse(post.content),
          id,
        },
      }
    : { notFound: true };
}

const BlogPost = (props) => (
  <Layout>
    <Post {...props} />
  </Layout>
);

export default BlogPost;
