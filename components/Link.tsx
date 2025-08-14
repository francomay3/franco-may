import { Anchor, type AnchorProps } from '@mantine/core';
import NextLink from 'next/link';
import { ComponentProps } from 'react';

type LinkProps = AnchorProps & ComponentProps<typeof NextLink>;

const Link = ({ href, ...props }: LinkProps) => {
  const isExternal =
    typeof href === 'string' &&
    (href.startsWith('http') || href.startsWith('mailto:'));

  return (
    <Anchor
      href={href}
      {...props}
      component={!isExternal ? NextLink : undefined}
    />
  );
};

export default Link;
