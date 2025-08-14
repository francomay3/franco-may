import PageTitle from '@/components/PageTitle';
import { Text, Typography } from '@mantine/core';
import Image from '@/components/Image';

export default function HomePage() {
  return (
    <Typography>
      <PageTitle>Welcome</PageTitle>

      <Image
        src="/home.jpg"
        alt="Me and Lucia sitting on a couch"
        w="100%"
        h={400}
        maw={600}
        mx="auto"
        mb="md"
      />

      <Text>
        I’m <strong>Franco May</strong>, married to Natasha and father to Lucia.
        Originally from Argentina, I now live in Gothenburg, Sweden, where I
        work as a full stack developer.
      </Text>

      <Text>
        I love deep philosophical dialogues and, whenever I can, I spend time at
        the piano.
      </Text>

      <Text>
        This site is my workshop of sorts: a place for programming experiments,
        side projects, and the occasional blog post when a thought is worth
        sharing. Nothing too formal—just a space to build, test, and think out
        loud.
      </Text>
    </Typography>
  );
}
