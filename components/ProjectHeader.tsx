import { Badge, Group, Text, Title } from '@mantine/core';
import { IconBrandGithub, IconCalendar } from '@tabler/icons-react';
import Link from '@/components/Link';
import { formatRange, getProject } from './projects';

/** Title, dates and links for a project page; the data lives in projects.ts. */
export function ProjectHeader({ slug }: { slug: string }) {
  const project = getProject(slug);
  return (
    <>
      <Link href="/projects" size="sm" ff="var(--mantine-font-family-headings)">
        ← All projects
      </Link>
      <Title order={1} mt="xs">
        {project.title}
      </Title>
      <Group gap="md" mt="xs" mb="md">
        <Group gap={4}>
          <IconCalendar size={16} />
          <Text size="sm" c="dimmed">
            {formatRange(project)}
          </Text>
        </Group>
        {project.repo && (
          <Link href={project.repo} target="_blank" size="sm">
            <Group gap={4}>
              <IconBrandGithub size={16} />
              Source
            </Group>
          </Link>
        )}
        {project.post && (
          <Link href={`/blog/${project.post}`} size="sm">
            Read the write-up
          </Link>
        )}
        {project.tags.map(tag => (
          <Badge key={tag} variant="light" size="sm">
            {tag}
          </Badge>
        ))}
      </Group>
      <Text c="dimmed" mb="lg">
        {project.summary}
      </Text>
    </>
  );
}
