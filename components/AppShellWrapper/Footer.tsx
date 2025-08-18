import { ActionIcon, Box, Card, Flex } from '@mantine/core';
import Link from '../Link';
import {
  IconBrandGithubFilled,
  IconBrandLinkedinFilled,
  IconExternalLink,
} from '@tabler/icons-react';

const Footer = () => {
  return (
    <Card
      component="footer"
      withBorder
      radius="0"
      style={{
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
      }}
    >
      <Flex
        bg="var(--mantine-color-neutral-1)"
        direction="column"
        align="center"
        justify="center"
        gap="10"
        p="20"
        mt="auto"
      >
        <Flex align="center" gap="4">
          Web development by Franco&nbsp;May
          <Link href="https://www.linkedin.com/in/francomay/" target="_blank">
            <ActionIcon variant="subtle">
              <IconBrandLinkedinFilled />
            </ActionIcon>
          </Link>
          <Link href="https://github.com/francomay3/" target="_blank">
            <ActionIcon variant="subtle">
              <IconBrandGithubFilled />
            </ActionIcon>
          </Link>
        </Flex>
        <Box>
          <Link
            href="https://github.com/francomay3/franco-may"
            target="_blank"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Check out this project&apos;s code <IconExternalLink size={16} />
          </Link>
        </Box>
      </Flex>
    </Card>
  );
};

export default Footer;
