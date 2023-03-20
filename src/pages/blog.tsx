import Blog from "@/components/pages/blog/Blog";
import Layout from "@/components/Layout";
import { getPosts } from "@/utils/postUtils";
import { PostFields } from "@/utils/types";

export async function getServerSideProps() {
  try {
    const posts = await getPosts();

    return {
      props: {
        posts,
      },
    };
  } catch (error) {
    return { props: {} };
  }
}

const BlogPage = ({ posts }: { posts: PostFields[] }) => {
  return (
    <Layout>
      <Blog posts={posts} />
    </Layout>
  );
};

export default BlogPage;
