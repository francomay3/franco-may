import PageTitle from '@/components/PageTitle';
import {
  Text,
  Typography,
  Box,
  Button,
  Group,
  Title,
  Card,
  Stack,
} from '@mantine/core';
import Image from '@/components/Image';
import Link from '@/components/Link';

//TODO: check all todos from: https://github.com/thedaviddias/Front-End-Checklist

export default function HomePage() {
  return (
    <Typography>
      <PageTitle>Welcome</PageTitle>

      <Stack gap="50">
        <Image
          src="/home.jpg"
          alt="Me and Lucia sitting on a couch"
          w="100%"
          h={400}
          maw={600}
          mx="auto"
        />

        <Box>
          <Text>
            I'm <strong>Franco May</strong>, married to Natasha and father to
            Lucia. Originally from Argentina, I now live in Gothenburg, Sweden,
            where I work as a full stack developer.
          </Text>

          <Text>
            I love deep philosophical dialogues and, whenever I can, I spend
            time at the piano.
          </Text>

          <Text>
            This site is my workshop of sorts: a place for programming
            experiments, side projects, and the occasional blog post when a
            thought is worth sharing. Nothing too formal, just a space to build,
            test, and think out loud.
          </Text>
        </Box>

        <Card withBorder maw={400} mx="auto">
          <Title order={3}>Let's Connect</Title>
          <Text>
            Interested in my thoughts or want to discuss ideas? I'd love to hear
            from you.
          </Text>
          <Group justify="center">
            <Link href="/blog">
              <Button variant="filled">Read My Blog</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline">Get in Touch</Button>
            </Link>
          </Group>
        </Card>
      </Stack>
    </Typography>
  );
}
