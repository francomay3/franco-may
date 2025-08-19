import { Box, Text } from '@mantine/core';
import Link from '@/components/Link';
import PageTitle from '@/components/PageTitle';
import posts from '@/posts';
import { Post } from '@/posts/types';

const Item = ({ post }: { post: Post }) => {
  return (
    <>
      <Text c="dimmed">
        {post.date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
        })}
      </Text>
      <Link href={`/blog/${post.slug}`}>
        <Text ff="var(--mantine-font-family-headings)">{post.title}</Text>
      </Link>
    </>
  );
};

// Group posts by year
const groupPostsByYear = (posts: Post[]) => {
  const postsByYear: { [key: number]: Post[] } = {};

  posts.forEach(post => {
    const year = post.date.getFullYear();
    if (!postsByYear[year]) {
      postsByYear[year] = [];
    }
    postsByYear[year].push(post);
  });

  // Sort posts within each year group by date (newest first)
  Object.keys(postsByYear).forEach(year => {
    postsByYear[Number(year)].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
  });

  return postsByYear;
};

export default function BlogPage() {
  const postsByYear = groupPostsByYear(posts);

  // Sort years in descending order (newest first)
  const sortedYears = Object.keys(postsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <Box>
      <PageTitle>Blog</PageTitle>

      <Text>
        This is where I collect thoughts. Probably not much code, but more ideas
        and the occasional ramble that I felt was worth writing down.
      </Text>

      {sortedYears.map(year => (
        <Box key={year} mt="xl">
          <Text size="xl" fw={600} mb="md">
            {year}
          </Text>
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '1rem',
              alignItems: 'start',
            }}
          >
            {postsByYear[year].map(post => (
              <Item post={post} key={post.slug} />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
