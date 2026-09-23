'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Group, Modal, Text } from '@mantine/core';

/**
 * A short id with a word in front of it, so a hash and a place uuid are not
 * two unmarked strings in a row. The link goes to the full id; the label
 * shows eight characters, which is enough to recognise one and short enough
 * to sit on a comment.
 */
export function IdLink({
  kind,
  id,
  href,
}: {
  kind: 'User' | 'Place';
  id: string;
  href: string;
}) {
  return (
    <Link href={href} className="fl-id">
      <b>{kind}</b>
      {id.slice(0, 8)}
    </Link>
  );
}

/**
 * The warning in front of taking something down.
 *
 * Hide and delete both remove a thing other people can see, and neither of
 * them should happen on the click that was only meant to scroll. The copy
 * says what actually happens: a comment stays on this page, marked hidden;
 * a photo leaves the place and the phone that uploaded it.
 */
export function ConfirmDialog({
  opened,
  title,
  body,
  confirmLabel,
  busy,
  onClose,
  onConfirm,
}: {
  opened: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      centered
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
    >
      <Text size="sm">{body}</Text>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" radius="xl" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button color="red" radius="xl" loading={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </Group>
    </Modal>
  );
}
