import { Box, Flex, Text } from '@mantine/core';
import posts, { Post } from '@/posts';
import Link from '@/components/Link';
import PageTitle from '@/components/PageTitle';

const Item = ({ post }: { post: Post }) => {
  return (
    <Link href={`/blog/${post.slug}`} key={post.slug}>
      <Flex gap="md" align="center" component="li">
        <Text c="dimmed">
          {post.date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        {post.title}
      </Flex>
    </Link>
  );
};

export default function BlogPage() {
  return (
    <Box>
      <PageTitle>Blog</PageTitle>

      <Text>
        This is where I collect thoughts. Probably not much code, but more ideas
        and the occasional ramble that I felt was worth writing down.
      </Text>
      <Box component="ul" mt="35" pl="0">
        {posts.map(post => (
          <Item post={post} key={post.slug} />
        ))}
      </Box>
    </Box>
  );
}
