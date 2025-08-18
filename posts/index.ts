import { ReactNode } from 'react';
import aigoals from './ai-goals';
import leibniz from './leibniz';

export type Post = {
  title: string;
  slug: string;
  Content: () => ReactNode;
  date: Date;
  lastUpdated: Date;
  excerpt: string;
  author: string;
  tags: string[];
  readingTime: string;
  featuredImage: string;
};

// TODO: each post file should default export a Post object. image, html, etc... all should be in the post file. maybe each post should have its own folder.

const posts: Post[] = [
  {
    title: 'AI and the Myth of Artificial Desire',
    slug: 'ai-and-the-myth-of-artificial-desire',
    Content: aigoals,
    date: new Date('2025-08-13'),
    lastUpdated: new Date('2025-08-13'),
    excerpt:
      'We are obsessed with the idea that artificial intelligences will rebel. But what if this stems from a fundamental misunderstanding of how intelligence works?',
    author: 'Franco May',
    tags: ['AI', 'Philosophy', 'Technology'],
    readingTime: '5 min read', // TODO: reading time could be calculated from the post content
    featuredImage: 'https://picsum.photos/200', // TODO: Replace with actual post-specific image. should be a full url.
  },
  {
    title: 'Why Is There Something Rather Than Nothing?',
    slug: 'why-is-there-something-rather-than-nothing',
    Content: leibniz,
    date: new Date('2025-08-14'),
    lastUpdated: new Date('2025-08-14'),
    excerpt:
      'A thought experiment exploring consciousness, simulation, and the nature of reality through mathematical analogies.',
    author: 'Franco May',
    tags: ['Philosophy', 'Consciousness', 'Mathematics'],
    readingTime: '8 min read',
    featuredImage: 'https://picsum.photos/200', // TODO: Replace with actual post-specific image. should be a full url.
  },
];

export default posts;
