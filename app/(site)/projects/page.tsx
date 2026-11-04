import type { Metadata } from 'next';
import { Badge, Box, Card, Group, Text, Title } from '@mantine/core';
import PageTitle from '@/components/PageTitle';
import Link from '@/components/Link';
import {
  KIND_LABEL,
  type Project,
  formatRange,
  projectsByYear,
} from './projects';

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Things I have built, newest first, each with the months I worked on it.',
};

const isExternal = (href: string) => href.startsWith('http');

const ProjectCard = ({ project }: { project: Project }) => (
  <Card
    withBorder
    component={Link}
    href={project.href}
    target={isExternal(project.href) ? '_blank' : undefined}
    td="none"
    c="inherit"
  >
    <Group justify="space-between" wrap="nowrap" align="flex-start">
      <Title order={4}>{project.title}</Title>
      <Badge variant={project.kind === 'demo' ? 'filled' : 'light'} size="sm">
        {KIND_LABEL[project.kind]}
      </Badge>
    </Group>
    <Text size="sm" mt={4}>
      {project.summary}
    </Text>
    <Group gap={6} mt="xs">
      {project.tags.map(tag => (
        <Text key={tag} size="xs" c="dimmed">
          #{tag}
        </Text>
      ))}
    </Group>
  </Card>
);

/** A date column next to the card, like the blog index but for date ranges. */
export default function ProjectsPage() {
  return (
    <Box>
      <PageTitle>Projects</PageTitle>
      <Text>
        Things I have built, newest first. The dates are the months between the
        first and the last commit, so a long span means I kept coming back to
        it. <strong>Try it</strong> opens a demo on this site, and
        <strong> Write-up</strong> opens the post about it.
      </Text>

      {projectsByYear().map(([year, projects]) => (
        <Box key={year} mt="xl">
          <Text size="xl" fw={600} mb="md">
            {year}
          </Text>
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(min(100%, 22rem), 1fr))',
              gap: 'var(--mantine-spacing-md)',
            }}
          >
            {projects.map(project => (
              <Box key={project.slug}>
                <Text size="sm" c="dimmed" mb={4}>
                  {formatRange(project)}
                </Text>
                <ProjectCard project={project} />
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
