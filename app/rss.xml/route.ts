import posts from '@/posts';
import { SITE_CONFIG } from '@/utils/constants';

export const dynamic = 'force-static';
export const revalidate = false;

export async function GET() {
  const sortedPosts = [...posts].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  const lastBuildDate =
    sortedPosts[0]?.date.toUTCString() || new Date().toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_CONFIG.name}</title>
    <link>${SITE_CONFIG.url}</link>
    <description>${SITE_CONFIG.description}</description>
    <language>${SITE_CONFIG.language}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_CONFIG.rssUrl}" rel="self" type="application/rss+xml" />
    ${sortedPosts
      .map(
        post => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_CONFIG.url}/blog/${post.slug}</link>
      <guid>${SITE_CONFIG.url}/blog/${post.slug}</guid>
      <pubDate>${post.date.toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt || post.title)}</description>
      ${post.author ? `<author>${escapeXml(post.author)}</author>` : ''}
      ${post.tags ? `<category>${escapeXml(post.tags.join(', '))}</category>` : ''}
    </item>`
      )
      .join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
