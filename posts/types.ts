export type Post = {
  title: string;
  slug: string;
  html: string;
  date: Date;
  lastUpdated: Date;
  excerpt: string;
  author: string;
  tags: string[];
  readingTime: string;
  featuredImage: string;
};
