import type { Metadata } from 'next';
import AuthorAdmin from './view';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ author: string }>;
}): Promise<Metadata> {
  const { author } = await params;
  return { title: `User ${decodeURIComponent(author).slice(0, 8)} · Historia Kartan` };
}

export default function Page() {
  return <AuthorAdmin />;
}
