import Layout from "@/components/Layout";
import { getDate, getPost } from "@/utils";
import Post from "@/components/blog-page/post";

export async function getServerSideProps(context: {
  params: { blogpost: any };
}) {
  const post = await getPost(context.params.blogpost);

  if (!post) {
    return {
      notFound: true,
    };
  }

  return {
    props: { post }, // will be passed to the page component as props
  };
}

type Post = {
  author: string;
  title: string;
  description: string;
  image: string;
  imageCaption: string;
  location: string;
  content: string;
  tags: string;
  date: number;
};

const BlogPost = ({ post }: { post: Post }) => {
  const { author, title, description, image, imageCaption, location, content } =
    post;
  const tags: string[] = JSON.parse(post.tags);
  const date = getDate(new Date(post.date));

  return (
    <Layout>
      <Post
        author={author}
        title={title}
        description={description}
        image={image}
        imageCaption={imageCaption}
        location={location}
        content={content}
        tags={tags}
        date={date}
      />
    </Layout>
  );
};

export default BlogPost;
