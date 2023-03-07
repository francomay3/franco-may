import Layout from "@/components/Layout";
import { getPost } from "@/utils/postUtils";
import Post from "@/components/blog-page/Post";

export async function getServerSideProps(context: {
  params: { blogpost: any };
}) {
  const id = context.params.blogpost;
  const post = await getPost(id);

  return post
    ? {
        props: {
          ...post,
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
