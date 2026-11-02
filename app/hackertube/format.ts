export function formatDuration(seconds: number | null): string {
  if (seconds === null) {
    return '';
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

const compact = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatCount(n: number | null): string {
  return n === null ? '–' : compact.format(n);
}

export function formatDate(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export const youtubeUrl = (id: string) =>
  `https://www.youtube.com/watch?v=${id}`;

/** An automatic frame from the middle of the video. */
export const midFrame = (id: string) => `https://i.ytimg.com/vi/${id}/hq2.jpg`;
/** The uploader's own thumbnail, for when there is no automatic frame. */
export const uploaderThumb = (id: string) =>
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
