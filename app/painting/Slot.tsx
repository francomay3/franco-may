import React from 'react';
import styles from './painting.module.css';

/** One image, or a dashed box saying which one is missing. */
export function Slot({
  src,
  label,
  alt,
  caption = true,
}: {
  src: string | null;
  label: string;
  alt: string;
  caption?: boolean;
}) {
  return (
    <figure className={styles.slot}>
      {src ? (
        <img src={src} alt={alt} loading="lazy" />
      ) : (
        <div className={styles.missing}>No {label.toLowerCase()} image</div>
      )}
      {caption && <figcaption>{label}</figcaption>}
    </figure>
  );
}
