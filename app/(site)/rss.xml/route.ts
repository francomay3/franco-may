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
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${SITE_CONFIG.name}</title>
    <link>${SITE_CONFIG.url}</link>
    <description>${SITE_CONFIG.description}</description>
    <language>${SITE_CONFIG.language}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_CONFIG.rssUrl}" rel="self" type="application/rss+xml" />
    
    <!-- TODO: Replace with actual site logo/branding image -->
    <image>
      <url>https://picsum.photos/200</url>
      <title>${SITE_CONFIG.name}</title>
      <link>${SITE_CONFIG.url}</link>
      <description>${SITE_CONFIG.description}</description>
      <height>200</height>
      <width>200</width>
    </image>
    
    <generator>Franco May Blog</generator>
    <webMaster>francomay3@gmail.com</webMaster>
    
    <!-- TODO: Check if we need PubSubHubbub hub for real-time feed updates -->
    <!-- <atom:link href="http://example.com/hub" rel="hub"/> -->
    
    ${sortedPosts
      .map(
        post => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_CONFIG.url}/blog/${post.slug}</link>
      <guid isPermaLink="false">${SITE_CONFIG.url}/blog/${post.slug}</guid>
      <pubDate>${post.date.toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt || post.title)}</description>
      ${post.author ? `<dc:creator>${escapeXml(post.author)}</dc:creator>` : ''}
      ${post.tags ? `<category>${escapeXml(post.tags.join(', '))}</category>` : ''}
      
      <atom:updated>${post.lastUpdated.toISOString()}</atom:updated>
      
      <!-- TODO: Parse and include full HTML content from post.Content -->
      <content:encoded><![CDATA[<p>${escapeXml(post.excerpt || post.title)}</p><p>Read the full article at: <a href="${SITE_CONFIG.url}/blog/${post.slug}">${SITE_CONFIG.url}/blog/${post.slug}</a></p>]]></content:encoded>
      
      ${`<enclosure url="${post.featuredImage}" type="image/jpeg" length="0" />`}
      ${`<media:content url="${post.featuredImage}" type="image/jpeg" medium="image" />`}
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
