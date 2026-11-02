import { useEffect, useRef, useState } from 'react';

/**
 * How many rows of a long list to show: `page` more each time the returned
 * sentinel element scrolls near the viewport (starting from `initial`). `reset` goes back to the first
 * page, for when the list is replaced.
 */
export function useInfinite(length: number, page: number, initial = page) {
  const [visible, setVisible] = useState(initial);
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) {
      return;
    }
    const io = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisible(n => n + page);
        }
      },
      { rootMargin: '600px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [length, page, visible]);

  return { visible, sentinel, reset: () => setVisible(page) };
}
