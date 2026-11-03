import React from 'react';
import { ActionIcon, Group, Tooltip } from '@mantine/core';
import {
  IconBookmark,
  IconBookmarkFilled,
  IconEye,
  IconEyeCheck,
  IconThumbDown,
  IconThumbDownFilled,
  IconThumbUp,
  IconThumbUpFilled,
} from '@tabler/icons-react';
import type { Reaction } from './seen';

type Props = {
  reaction: Reaction | null;
  onReact: (reaction: Reaction | null) => void;
  watchLater: boolean;
  onToggleWatchLater: (on: boolean) => void;
  seen: boolean;
  onToggleSeen: (seen: boolean) => void;
  /** Icon size in px; the button grows with it. */
  size?: number;
};

/**
 * The four things you can say about a video, as quiet gray icons that take
 * their colour only while on: green like, red not interested, amber saved,
 * blue seen. Used on rows and on the video page so a video looks the same
 * everywhere.
 */
export function ReactionButtons({
  reaction,
  onReact,
  watchLater,
  onToggleWatchLater,
  seen,
  onToggleSeen,
  size = 18,
}: Props) {
  const box = size + 14;
  const button = (
    on: boolean,
    color: string,
    label: string,
    onClick: () => void,
    icon: React.ReactNode
  ) => (
    <Tooltip label={label} withArrow>
      <ActionIcon
        variant={on ? 'light' : 'subtle'}
        color={on ? color : 'gray'}
        radius="xl"
        size={box}
        aria-label={label}
        aria-pressed={on}
        onClick={onClick}
      >
        {icon}
      </ActionIcon>
    </Tooltip>
  );

  const liked = reaction === 'like';
  const disliked = reaction === 'dislike';
  return (
    <Group gap={2} wrap="nowrap" justify="flex-end" data-noopen>
      {button(
        liked,
        'green',
        liked ? 'Unlike' : 'Like',
        () => onReact(liked ? null : 'like'),
        liked ? <IconThumbUpFilled size={size} /> : <IconThumbUp size={size} />
      )}
      {button(
        disliked,
        'red',
        disliked ? 'Undo not interested' : 'Not interested',
        () => onReact(disliked ? null : 'dislike'),
        disliked ? (
          <IconThumbDownFilled size={size} />
        ) : (
          <IconThumbDown size={size} />
        )
      )}
      {button(
        watchLater,
        'orange',
        watchLater ? 'Remove from watch later' : 'Watch later',
        () => onToggleWatchLater(!watchLater),
        watchLater ? (
          <IconBookmarkFilled size={size} />
        ) : (
          <IconBookmark size={size} />
        )
      )}
      {button(
        seen,
        'blue',
        seen ? 'Mark as not seen' : 'Mark as seen',
        () => onToggleSeen(!seen),
        seen ? <IconEyeCheck size={size} /> : <IconEye size={size} />
      )}
    </Group>
  );
}
