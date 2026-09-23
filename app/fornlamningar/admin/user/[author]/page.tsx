'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Alert, Button, Group, Loader, Text } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import {
  currentToken,
  errorCode,
  photoStorage,
  redirectToken,
  signIn,
  signOut,
} from '../../auth';
import { IdLink } from '../../ui';

/**
 * One contributor: the comments and photos they published, and the places
 * they answered about. The id in the path is the pseudonym from the comment
 * list, never the write credential.
 */

type Author = {
  id: string;
  comments: {
    total: number;
    items: {
      event_id: string;
      place_uuid: string;
      title: string | null;
      body: string;
      created_at: string;
      removed_at: string | null;
    }[];
  };
  photos: {
    event_id: string;
    place_uuid: string;
    title: string | null;
    status: 'pending' | 'published';
    created_at: string;
  }[];
  places: {
    place_uuid: string;
    title: string | null;
    been: boolean | null;
    stars: number | null;
    not_found: boolean;
    sign: string | null;
    last_at: string;
  }[];
  places_total: number;
};

export default function AuthorAdminPage() {
  const params = useParams<{ author: string }>();
  const id = decodeURIComponent(params.author ?? '');
  const [token, setToken] = useState<string | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (t: string) => {
      const res = await fetch(
        `/api/fornlamningar/author?id=${encodeURIComponent(id)}`,
        { headers: { Authorization: `Bearer ${t}` } }
      );
      if (!res.ok) {
        setError(
          res.status === 404 ? 'No contributor with that id.' : `${res.status}`
        );
        setAuthor(null);
        return;
      }
      setAuthor((await res.json()) as Author);
      setError(null);
    },
    [id]
  );

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
      <div>
        <p className="fl-kicker">User</p>
        <h1 className="fl-title">Sign in</h1>
        {error ? (
          <Alert color="red" mt="md">
            {error}
          </Alert>
        ) : null}
        <Button mt="md" radius="xl" color="dark" onClick={() => void signIn()}>
          Sign in with Google
        </Button>
      </div>
    );
  }

  if (!author) {
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
    <div>
      <Link href="/fornlamningar/admin" className="fl-back">
        <IconArrowLeft size={16} />
        Moderation
      </Link>
      <header className="fl-top">
        <div>
          <p className="fl-kicker">User</p>
          <h1 className="fl-title">{author.id.slice(0, 8)}</h1>
          <p className="fl-sub">{author.id}</p>
        </div>
        <button
          type="button"
          className="fl-quiet"
          onClick={() => void signOut().then(() => setToken(null))}
        >
          Sign out
        </button>
      </header>

      <div className="fl-section">
        <div>
          <h2>Places</h2>
          <p className="fl-count">
            {author.places.length}
            {author.places_total > author.places.length
              ? ` of ${author.places_total}`
              : ''}
          </p>
        </div>
      </div>
      {author.places.length === 0 ? (
        <p className="fl-empty">No place this person has answered about.</p>
      ) : (
        <div className="fl-list">
          {author.places.map(p => (
            <article key={p.place_uuid} className="fl-card">
              <p className="fl-body">{p.title ?? 'Untitled place'}</p>
              <div className="fl-meta">
                <span>{placeLine(p)}</span>
                <span>{new Date(p.last_at).toLocaleString('sv-SE')}</span>
                <IdLink
                  kind="Place"
                  id={p.place_uuid}
                  href={`/fornlamningar/admin/${encodeURIComponent(p.place_uuid)}`}
                />
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="fl-section">
        <div>
          <h2>Comments</h2>
          <p className="fl-count">
            {author.comments.items.length}
            {author.comments.total > author.comments.items.length
              ? ` of ${author.comments.total}`
              : ''}
          </p>
        </div>
      </div>
      {author.comments.items.length === 0 ? (
        <p className="fl-empty">No comments.</p>
      ) : (
        <div className="fl-list">
          {author.comments.items.map(c => (
            <article
              key={c.event_id}
              className={`fl-card fl-comment${c.removed_at ? ' is-hidden' : ''}`}
            >
              <div className="fl-comment-main">
                <p className="fl-body">{c.body}</p>
                <div className="fl-meta">
                  <span>{c.title ?? 'Untitled place'}</span>
                  <span>{new Date(c.created_at).toLocaleString('sv-SE')}</span>
                  {c.removed_at ? (
                    <span className="fl-pill">Hidden</span>
                  ) : null}
                  <IdLink
                    kind="Place"
                    id={c.place_uuid}
                    href={`/fornlamningar/admin/${encodeURIComponent(c.place_uuid)}`}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="fl-section">
        <h2>Photos</h2>
      </div>
      {author.photos.length === 0 ? (
        <p className="fl-empty">No photos.</p>
      ) : (
        <div className="fl-photos">
          {author.photos.map(p => (
            <PhotoCard key={p.event_id} photo={p} />
          ))}
        </div>
      )}
      {error ? (
        <Alert color="red" mt="md">
          {error}
        </Alert>
      ) : null}
    </div>
  );
}

function placeLine(p: Author['places'][number]): string {
  const bits: string[] = [];
  if (p.been === true) bits.push('Been here');
  else if (p.been === false) bits.push('Has not been');
  if (p.not_found) bits.push('Could not find it');
  else if (p.stars != null) bits.push(`${p.stars} stars`);
  if (p.sign) bits.push(`Sign: ${p.sign}`);
  return bits.join(' · ') || 'Answered';
}

function PhotoCard({ photo }: { photo: Author['photos'][number] }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let dead = false;
    let objectUrl: string | null = null;
    void (async () => {
      try {
        const { ref, getBytes } = await import('firebase/storage');
        const object = ref(
          await photoStorage(),
          `photos/${photo.event_id}.jpg`
        );
        const bytes = await getBytes(object);
        if (dead) return;
        objectUrl = URL.createObjectURL(
          new Blob([bytes], { type: 'image/jpeg' })
        );
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
    <article className="fl-photo">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" />
      ) : (
        <div className="fl-photo-missing">No file</div>
      )}
      <footer>
        <div>
          <span
            className={`fl-pill${photo.status === 'published' ? ' is-ok' : ''}`}
          >
            {photo.status}
          </span>
          <div className="fl-count">{photo.title ?? 'Untitled place'}</div>
        </div>
        <IdLink
          kind="Place"
          id={photo.place_uuid}
          href={`/fornlamningar/admin/${encodeURIComponent(photo.place_uuid)}`}
        />
      </footer>
    </article>
  );
}
