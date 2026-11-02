export type Video = {
  id: string;
  title: string;
  channel: string;
  /** YouTube channel id; videos of one channel share it. */
  channelId: string | null;
  summary: string;
  whyHn: string;
  type: string;
  shelfLife: string;
  tags: string[];
  cats: string[];
  /** HackerTube's rating: rec_months + 0.5 x months with a strong recommendation. */
  score: number;
  recommenders: number;
  /** YYYY-MM-DD */
  published: string | null;
  /** Seconds. */
  duration: number | null;
  views: number | null;
  likes: number | null;
  embeddable: boolean | null;
  gone: boolean;
};

export type Area = {
  id: string;
  name: string;
  categories: { id: string; name: string }[];
};

export type Dataset = {
  areas: Area[];
  videos: Video[];
  /** int8, row i is videos[i], DIM values per row. */
  embeddings: Int8Array;
};

export const DIM = 384;
