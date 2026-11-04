export interface Img {
  name: string;
  thumb: string;
  full: string;
}

export interface Post {
  id: string;
  title: string;
  date: string;
  summary: string;
  html: string;
  /** Path in the Storage bucket, e.g. painting/videos/123.mp4. */
  video: string;
  poster: string;
  posterFull: string;
  duration: number;
  reference: string | null;
  final: string | null;
  gallery: Img[];
  series?: string;
}

export interface ListItem {
  kind: 'post' | 'series';
  id: string;
  title: string;
  date: string;
  summary: string;
  reference: string | null;
  final: string | null;
  parts?: string[];
}

export interface Library {
  items: ListItem[];
  posts: Record<string, Post>;
  series: Record<string, { id: string; title: string; parts: string[] }>;
}
