'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { formatDate, formatDuration } from './format';
import { usePainting } from './PaintingProvider';
import { Slot } from './Slot';
import styles from './painting.module.css';
import type { ListItem } from './types';

const SCROLL_KEY = 'painting-list-scroll';

function Row({ item }: { item: ListItem }) {
  const { library } = usePainting();
  const first = item.kind === 'series' ? item.parts![0] : item.id;
  const href = `/painting/post/${first}`;
  const parts = item.parts?.map(p => library.posts[p]);
  const total = parts
    ? parts.reduce((a, p) => a + p.duration, 0)
    : library.posts[item.id].duration;

  return (
    <article className={styles.entry}>
      <div className={styles.row}>
        <Slot
          src={item.reference}
          label="Reference"
          alt={`${item.title} reference`}
          caption={false}
        />
        <Slot
          src={item.final}
          label="Painting"
          alt={`${item.title} painting`}
          caption={false}
        />
        <div className={styles.text}>
          <h2>
            {/* its ::after stretches over the whole row, so the row is the link */}
            <Link href={href}>{item.title}</Link>
          </h2>
          <div className={styles.meta}>
            {item.kind === 'series' && (
              <span className={styles.badge}>{parts!.length}-part series</span>
            )}
            <span>{formatDate(item.date)}</span>
            <span>{formatDuration(total)}</span>
          </div>
          <p>{item.summary}</p>
        </div>
      </div>
      {parts && (
        <ol className={styles.parts}>
          {parts.map((p, i) => (
            <li key={p.id}>
              <Link href={`/painting/post/${p.id}`}>
                <img src={p.poster} alt="" loading="lazy" />
                <div>
                  <strong>{p.title}</strong>
                  <span>
                    Part {i + 1} · {formatDate(p.date)} ·{' '}
                    {formatDuration(p.duration)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

export function List() {
  const { library } = usePainting();

  // Coming back from a tutorial lands where the list was left.
  useEffect(() => {
    window.scrollTo(0, Number(sessionStorage.getItem(SCROLL_KEY) ?? 0));
    const save = () =>
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, []);

  return (
    <main className={styles.page}>
      {library.items.map(item => (
        <Row key={item.id} item={item} />
      ))}
    </main>
  );
}
