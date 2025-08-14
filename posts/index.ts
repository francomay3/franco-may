import { ReactNode } from 'react';
import aigoals from './ai-goals';

export type Post = {
  title: string;
  slug: string;
  Content: () => ReactNode;
  date: Date;
};

const posts: Post[] = [
  {
    title: 'AI and the Myth of Artificial Desire',
    slug: 'ia-goals',
    Content: aigoals,
    date: new Date('2025-08-14'),
  },
];

export default posts;
