import Head from "next/head";
import Blog from "@/components/pages/blog/Blog";
import { getPosts } from "@/utils/postUtils";
import { PostFields } from "@/utils/types";

export async function getStaticProps() {
  try {
    const posts = await getPosts();

    return {
      props: {
        posts,
      },
      revalidate: 86400,
    };
  } catch (error) {
    return { notFound: true };
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
