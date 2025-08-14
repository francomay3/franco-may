import { Anchor, Box, Flex, Text, Title } from '@mantine/core';
import posts, { Post } from '@/posts';

const Item = ({ post }: { post: Post }) => {
  return (
    <Flex gap="md" align="center" component="li">
      {/* TODO: bullet point should be a dynamic color depending on the dark or light mode */}
      <Box w="8px" h="8px" bg="dark" bdrs="50%" />
      <Anchor href={`/blog/${post.slug}`} key={post.slug}>
        {post.title}
      </Anchor>

      <Text c="dimmed" size="sm">
        {post.date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </Text>
    </Flex>
  );
};

export default function BlogPage() {
  return (
    <Box>
      <Title mb="60" ta="center">
        Blog
      </Title>
      <ul>
        {posts.map(post => (
          <Item post={post} key={post.slug} />
        ))}
      </ul>
    </Box>
  );
}
