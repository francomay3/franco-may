import { notFound } from 'next/navigation';
import { Stack, Text, Typography } from '@mantine/core';
import posts from '@/posts';
import Breadcrumbs from '@/components/Breadcrumbs';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = posts.find(p => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  const PostContent = post.Content;

  return (
    <>
      <Stack gap="lg" mb="lg">
        <Breadcrumbs />
        <Text c="dimmed" size="sm" mt="xs">
          {post.date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </Stack>
      <Typography>
        <PostContent />
      </Typography>
    </>
  );
}
