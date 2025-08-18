import aigoals from './ai-goals';
import leibniz from './leibniz';
import { Post } from './types';

// TODO: each post file should default export a Post object. image, html, etc... all should be in the post file. maybe each post should have its own folder.

const posts: Post[] = [
  aigoals,
  leibniz,
  // {
  //   title: 'Why Is There Something Rather Than Nothing?',
  //   slug: 'why-is-there-something-rather-than-nothing',
  //   Content: leibniz,
  //   date: new Date('2025-08-14'),
  //   lastUpdated: new Date('2025-08-14'),
  //   excerpt:
  //     'A thought experiment exploring consciousness, simulation, and the nature of reality through mathematical analogies.',
  //   author: 'Franco May',
  //   tags: ['Philosophy', 'Consciousness', 'Mathematics'],
  //   readingTime: '8 min read',
  //   featuredImage: 'https://picsum.photos/200', // TODO: Replace with actual post-specific image. should be a full url.
  // },
];

export default posts;
