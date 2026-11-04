export type ProjectKind = 'demo' | 'live' | 'writeup' | 'repo';

export type Project = {
  slug: string;
  title: string;
  summary: string;
  /** First commit, "YYYY-MM". */
  start: string;
  /** Last meaningful commit, "YYYY-MM". */
  end: string;
  kind: ProjectKind;
  /** Where the card leads on this site, or to an external page. */
  href: string;
  repo?: string;
  /** Blog post that goes with it. */
  post?: string;
  tags: string[];
};

const GITHUB = 'https://github.com/francomay3';

/** Dates come from each repo's first and last commit. */
export const PROJECTS: Project[] = [
  {
    slug: 'gravity',
    title: 'Gravity Grid',
    summary:
      'An n-body gravity simulation: a galaxy of planets that attract, collide and merge. Written three times between 2023 and 2025.',
    start: '2023-08',
    end: '2025-01',
    kind: 'demo',
    href: '/projects/gravity',
    repo: `${GITHUB}/gravity-grid-pixijs`,
    tags: ['Simulation', 'Canvas', 'TypeScript'],
  },
  {
    slug: 'not-react',
    title: 'not-react',
    summary: 'A JSX app with no React in it, to see how little it takes.',
    start: '2023-09',
    end: '2023-09',
    kind: 'writeup',
    href: '/blog/jsx-without-react',
    repo: `${GITHUB}/not-react`,
    post: 'jsx-without-react',
    tags: ['JSX', 'Babel'],
  },
  {
    slug: 'sudoku',
    title: 'Sudoku',
    summary:
      'A sudoku game with notes, undo, live error checking and five difficulties.',
    start: '2024-01',
    end: '2024-02',
    kind: 'demo',
    href: '/projects/sudoku',
    repo: `${GITHUB}/sudokuApp`,
    tags: ['Game', 'React'],
  },
  {
    slug: 'cpp-loader',
    title: 'vite-plugin-cpp-loader',
    summary:
      'An npm package that lets you import C++ files into TypeScript, compiled to WebAssembly.',
    start: '2025-05',
    end: '2026-04',
    kind: 'writeup',
    href: '/blog/importing-cpp-into-typescript',
    repo: `${GITHUB}/vite-plugin-cpp-loader`,
    post: 'importing-cpp-into-typescript',
    tags: ['Vite', 'WebAssembly', 'C++', 'npm'],
  },
  {
    slug: 'naturalneits',
    title: 'Naturalneits',
    summary: 'A Shopify storefront built with Next.js 15 and React 19.',
    start: '2025-06',
    end: '2025-08',
    kind: 'live',
    href: 'https://naturalneits-commerce.vercel.app',
    repo: `${GITHUB}/naturalneits-commerce`,
    tags: ['Next.js', 'Shopify'],
  },
  {
    slug: 'fornlamningar',
    title: 'Historia Kartan',
    summary:
      "A map of Sweden's archaeological sites, built from a register of 312,000 remains.",
    start: '2025-08',
    end: '2026-11',
    kind: 'live',
    href: '/fornlamningar/map',
    repo: `${GITHUB}/fornlamningar`,
    post: 'from-312000-remains-to-10000-pins',
    tags: ['Map', 'Data pipeline', 'Expo'],
  },
  {
    slug: 'ferment-log',
    title: 'Ferment Log',
    summary: 'A React Native app for tracking fermentation batches.',
    start: '2025-10',
    end: '2025-11',
    kind: 'repo',
    href: `${GITHUB}/ferment-log`,
    repo: `${GITHUB}/ferment-log`,
    tags: ['React Native', 'Expo'],
  },
  {
    slug: 'biljakt',
    title: 'Biljakt',
    summary:
      'Scrapes used-car listings and ranks them with configurable scoring rules.',
    start: '2026-01',
    end: '2026-03',
    kind: 'writeup',
    href: '/blog/biljakt-ranking-used-cars',
    repo: `${GITHUB}/Biljakt`,
    post: 'biljakt-ranking-used-cars',
    tags: ['Scraping', 'Scoring'],
  },
  {
    slug: 'duel',
    title: 'Name duels',
    summary:
      'Pick the name you like more, head to head, and watch a ranking build. The idea behind a baby-name app where friends and family vote.',
    start: '2026-02',
    end: '2026-03',
    kind: 'demo',
    href: '/projects/duel',
    repo: `${GITHUB}/babyname`,
    tags: ['Ranking', 'Firebase'],
  },
  {
    slug: 'impasto',
    title: 'Impasto',
    summary:
      'Pull a palette out of a photo and get paint mixing recipes for it.',
    start: '2026-03',
    end: '2026-04',
    kind: 'demo',
    href: '/projects/impasto',
    repo: `${GITHUB}/impasto`,
    tags: ['Color', 'k-means', 'Painting'],
  },
  {
    slug: 'life-satisfaction',
    title: 'Life satisfaction',
    summary: 'A life satisfaction index built from how you see yourself.',
    start: '2026-09',
    end: '2026-09',
    kind: 'live',
    href: '/life-satisfaction',
    tags: ['Quiz'],
  },
  {
    slug: 'explorer',
    title: 'Explorer',
    summary:
      'A fast file explorer for macOS in the spirit of Windows Explorer: folder tree on the left, files on the right. Native Swift, so no demo here.',
    start: '2026-10',
    end: '2026-10',
    kind: 'repo',
    href: `${GITHUB}/explorer`,
    repo: `${GITHUB}/explorer`,
    tags: ['Swift', 'AppKit', 'macOS'],
  },
  {
    slug: 'hackertube',
    title: 'HackerTube',
    summary: 'A video feed for programmers, ranked by what you react to.',
    start: '2026-11',
    end: '2026-11',
    kind: 'live',
    href: '/hackertube',
    tags: ['Video', 'Firebase'],
  },
];

export const getProject = (slug: string): Project => {
  const project = PROJECTS.find(p => p.slug === slug);
  if (!project) {
    throw new Error(`Unknown project: ${slug}`);
  }
  return project;
};

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const parse = (value: string) => {
  const [year, month] = value.split('-').map(Number);
  return { year, month: MONTHS[month - 1] };
};

/** "Oct 2026", "Mar – Apr 2026" or "Aug 2023 – Jan 2025". */
export function formatRange({ start, end }: Pick<Project, 'start' | 'end'>) {
  if (start === end) {
    const { year, month } = parse(start);
    return `${month} ${year}`;
  }
  const a = parse(start);
  const b = parse(end);
  return a.year === b.year
    ? `${a.month} – ${b.month} ${b.year}`
    : `${a.month} ${a.year} – ${b.month} ${b.year}`;
}

/** Newest first, by when the work ended and then by when it began. */
export const projectsByYear = () => {
  const sorted = [...PROJECTS].sort(
    (a, b) => b.end.localeCompare(a.end) || b.start.localeCompare(a.start)
  );
  const groups = new Map<string, Project[]>();
  for (const project of sorted) {
    const year = project.end.slice(0, 4);
    groups.set(year, [...(groups.get(year) ?? []), project]);
  }
  return [...groups.entries()];
};

export const KIND_LABEL: Record<ProjectKind, string> = {
  demo: 'Try it',
  live: 'Live',
  writeup: 'Write-up',
  repo: 'Code',
};
