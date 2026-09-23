'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  currentToken,
  errorCode,
  photoStorage,
  redirectToken,
  signIn,
  signOut,
} from '../auth';

/**
 * One place. The id in the path is a register number or the uuid the app
 * uses; the API resolves either. Photos can be removed from here. Comments
 * can be hidden. The description and its image credits are what was
 * published with the place, not something this page edits.
 */

type Place = {
  query: string;
  uuid: string | null;
  title: string | null;
  content: string | null;
  fornsok: string | null;
  sources: { file: string; by: string | null; lic: string | null; page: string | null }[];
  comments: {
    event_id: string;
    author: string | null;
    body: string;
    created_at: string;
    removed_at: string | null;
  }[];
  photos: {
    event_id: string;
    status: 'pending' | 'published';
    width: number | null;
    height: number | null;
    created_at: string;
  }[];
};

export default function PlaceAdminPage() {
  const params = useParams<{ featureid: string }>();
  const id = decodeURIComponent(params.featureid ?? '');
  const [token, setToken] = useState<string | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (t: string) => {
    const res = await fetch(
      `/api/fornlamningar/place?id=${encodeURIComponent(id)}`,
      { headers: { Authorization: `Bearer ${t}` } }
    );
    if (!res.ok) {
      setError(`${res.status}`);
      return;
    }
    setPlace((await res.json()) as Place);
    setError(null);
  }, [id]);

  useEffect(() => {
    void (async () => {
      try {
        const t = (await redirectToken()) ?? (await currentToken());
        setToken(t);
        if (t) await load(t);
      } catch (e) {
        setError(errorCode(e) ?? 'Sign-in failed.');
      }
    })();
  }, [load]);

  const hide = async (eventId: string) => {
    if (!token) return;
    setBusy(eventId);
    try {
      const res = await fetch('/api/fornlamningar/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'hide', event_id: eventId }),
      });
      if (!res.ok) {
        setError(`hide failed: ${res.status}`);
        return;
      }
      await load(token);
    } finally {
      setBusy(null);
    }
  };

  const removePhoto = async (eventId: string) => {
    if (!token) return;
    setBusy(eventId);
    try {
      const { ref, deleteObject } = await import('firebase/storage');
      const object = ref(await photoStorage(), `photos/${eventId}.jpg`);
      await deleteObject(object).catch(() => undefined);
      const res = await fetch('/api/fornlamningar/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'delete_photo', event_id: eventId }),
      });
      if (!res.ok) {
        setError(`delete failed: ${res.status}`);
        return;
      }
      await load(token);
    } finally {
      setBusy(null);
    }
  };

  if (!token && !error) {
    return (
      <Group>
        <Loader size="sm" />
        <Text>Checking…</Text>
      </Group>
    );
  }

  if (!token) {
    return (
      <Stack align="flex-start">
        <Title order={2}>Place</Title>
        {error ? <Alert color="red">{error}</Alert> : null}
        <Button onClick={() => void signIn()}>Sign in with Google</Button>
      </Stack>
    );
  }

  if (!place) {
    return error ? (
      <Alert color="red">{error}</Alert>
    ) : (
      <Group>
        <Loader size="sm" />
        <Text>Loading…</Text>
      </Group>
    );
  }

  return (
    <Stack maw={720}>
      <Group justify="space-between">
        <Title order={2}>{place.title ?? id}</Title>
        <Button
          variant="subtle"
          size="xs"
          onClick={() => void signOut().then(() => setToken(null))}
        >
          Sign out
        </Button>
      </Group>
      <Text size="sm">
        <Link href="/fornlamningar/admin">Moderation</Link>
        {' · '}
        {id}
        {place.uuid && place.uuid !== id ? ` · ${place.uuid}` : ''}
      </Text>
      {!place.uuid ? (
        <Alert color="yellow">No place with that id.</Alert>
      ) : (
        <>
          {place.fornsok ? (
            <Text size="sm">
              <a href={place.fornsok} target="_blank" rel="noreferrer">
                Fornsök
              </a>
            </Text>
          ) : null}
          {place.content ? (
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {place.content}
            </Text>
          ) : (
            <Text size="sm" c="dimmed">
              No description published for this place.
            </Text>
          )}

          <Title order={4}>Sources</Title>
          {place.sources.length === 0 ? (
            <Text size="sm" c="dimmed">
              No images on the description.
            </Text>
          ) : (
            <Stack gap={4}>
              {place.sources.map(s => (
                <Text key={s.file} size="sm">
                  {s.page ? (
                    <a href={s.page} target="_blank" rel="noreferrer">
                      {s.file}
                    </a>
                  ) : (
                    s.file
                  )}
                  {s.by ? ` — ${s.by}` : ''}
                  {s.lic ? `, ${s.lic}` : ''}
                </Text>
              ))}
            </Stack>
          )}

          <Title order={4}>Photos</Title>
          {place.photos.length === 0 ? (
            <Text size="sm" c="dimmed">
              No visitor photos.
            </Text>
          ) : (
            <Stack gap="xs">
              {place.photos.map(p => (
                <PhotoRow
                  key={p.event_id}
                  photo={p}
                  busy={busy === p.event_id}
                  onDelete={() => void removePhoto(p.event_id)}
                />
              ))}
            </Stack>
          )}

          <Title order={4}>Comments</Title>
          {place.comments.length === 0 ? (
            <Text size="sm" c="dimmed">
              No comments.
            </Text>
          ) : (
            <Stack gap="xs">
              {place.comments.map(c => (
                <Card
                  key={c.event_id}
                  withBorder
                  padding="sm"
                  opacity={c.removed_at ? 0.5 : 1}
                >
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Stack gap={2} style={{ minWidth: 0 }}>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {c.body}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {new Date(c.created_at).toLocaleString('sv-SE')} ·{' '}
                        {c.author?.slice(0, 8) ?? 'unknown'}
                      </Text>
                    </Stack>
                    {c.removed_at ? (
                      <Badge color="gray" variant="light">
                        hidden
                      </Badge>
                    ) : (
                      <Button
                        size="xs"
                        variant="light"
                        color="red"
                        loading={busy === c.event_id}
                        onClick={() => void hide(c.event_id)}
                      >
                        Hide
                      </Button>
                    )}
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </>
      )}
      {error ? <Alert color="red">{error}</Alert> : null}
    </Stack>
  );
}

function PhotoRow({
  photo,
  busy,
  onDelete,
}: {
  photo: Place['photos'][number];
  busy: boolean;
  onDelete: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let dead = false;
    let objectUrl: string | null = null;
    void (async () => {
      try {
        const { ref, getBytes } = await import('firebase/storage');
        const object = ref(await photoStorage(), `photos/${photo.event_id}.jpg`);
        const bytes = await getBytes(object);
        if (dead) return;
        objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
        setUrl(objectUrl);
      } catch {
        if (!dead) setUrl(null);
      }
    })();
    return () => {
      dead = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photo.event_id]);

  return (
    <Card withBorder padding="sm">
      <Group align="flex-start" wrap="nowrap">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            style={{ width: 120, height: 90, objectFit: 'cover' }}
          />
        ) : (
          <Text size="xs" c="dimmed" w={120}>
            No file
          </Text>
        )}
        <Stack gap={2}>
          <Badge variant="light" w="fit-content">
            {photo.status}
          </Badge>
          <Text size="xs" c="dimmed">
            {new Date(photo.created_at).toLocaleString('sv-SE')}
          </Text>
          <Button
            size="xs"
            color="red"
            variant="light"
            loading={busy}
            onClick={onDelete}
          >
            Delete
          </Button>
        </Stack>
      </Group>
    </Card>
  );
}
