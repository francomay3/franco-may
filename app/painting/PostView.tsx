'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatDate, formatDuration } from './format';
import { usePainting } from './PaintingProvider';
import { Slot } from './Slot';
import styles from './painting.module.css';

const Player = dynamic(() => import('./Player'), {
  ssr: false,
  loading: () => <div className={styles.playerLoading} />,
});

export function PostView() {
  const { id } = useParams<{ id: string }>();
  const { library } = usePainting();
  const post = library.posts[id];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!post) {
    return (
      <main className={styles.page}>
        Post not found. <Link href="/painting">Back</Link>
      </main>
    );
  }
  const series = post.series ? library.series[post.series] : null;

  return (
    <main className={`${styles.page} ${styles.post}`}>
      <Link href="/painting" className={styles.back}>
        ← All tutorials
      </Link>
      <h1>{post.title}</h1>
      <div className={styles.meta}>
        <span>{formatDate(post.date)}</span>
        <span>{formatDuration(post.duration)}</span>
        <a href={post.patreonUrl} target="_blank" rel="noreferrer">
          Original Patreon post ↗
        </a>
      </div>

      {series && (
        <nav className={styles.tabs}>
          <span>{series.title}</span>
          {series.parts.map((p, i) => (
            <Link
              key={p}
              href={`/painting/post/${p}`}
              className={p === id ? styles.on : ''}
            >
              Part {i + 1}
            </Link>
          ))}
        </nav>
      )}

      <Player
        id={post.id}
        path={post.video}
        title={post.title}
        poster={post.posterFull}
      />

      {/* Patreon's own HTML; scripts and inline handlers were removed when it was built. */}
      <div
        className={styles.body}
        dangerouslySetInnerHTML={{ __html: post.html }}
      />

      {post.gallery.length > 0 && (
        <>
          <h3>Images</h3>
          <div className={styles.gallery}>
            {post.gallery.map(g => (
              <a key={g.name} href={g.full} target="_blank" rel="noreferrer">
                <Slot
                  src={g.thumb}
                  label={g.name.replace(/\.[^.]+$/, '')}
                  alt={g.name}
                />
              </a>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
