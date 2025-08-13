import { Container, Box } from '@mantine/core';
import Breadcrumbs from '../../components/Breadcrumbs';

interface BlogLayoutProps {
  children: React.ReactNode;
}

export default function BlogLayout({ children }: BlogLayoutProps) {
  return (
    <Container size="md" py="xl">
      <Box mb="lg">
        <Breadcrumbs />
      </Box>
      <Box>{children}</Box>
    </Container>
  );
}
