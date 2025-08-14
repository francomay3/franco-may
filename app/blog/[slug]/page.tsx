import { notFound } from 'next/navigation';
import { Stack, Text, Typography } from '@mantine/core';
import posts from '@/posts';
import Breadcrumbs from '@/components/Breadcrumbs';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = posts.find(p => p.slug === slug);

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
