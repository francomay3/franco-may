import { notFound } from 'next/navigation';
import { Box, Text, Title, Typography } from '@mantine/core';
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

  return (
    <>
      <Breadcrumbs />
      <Typography component="article" mt="xl">
        <Title>{post.title}</Title>
        <Text c="dimmed" size="sm" mt="0">
          {post.date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Box dangerouslySetInnerHTML={{ __html: post.html }} />
      </Typography>
    </>
  );
}
