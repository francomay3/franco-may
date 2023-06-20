import Head from "next/head";
import Blog from "@/components/pages/blog/Blog";
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
    <>
      <Head>
        <title>Franco May - Blog</title>
      </Head>
      <Blog posts={posts} />
    </>
  );
};

export default BlogPage;
