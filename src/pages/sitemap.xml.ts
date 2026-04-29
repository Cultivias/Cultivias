import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const articles = await getCollection('articles');

  const staticPages = [
    '',
    '/voce/',
    '/povrce/',
    '/bilje/',
    '/vijesti/',
    '/o-nama/',
    '/kolacici/',
    '/uvjeti-koristenja/',
    '/politika-privatnosti/',
  ];

  const articleUrls = articles.map(a =>
    `/${a.data.category}/${a.slug}/`
  );

  const allUrls = [...staticPages, ...articleUrls];
  const siteUrl = 'https://cultivias.com';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url>
    <loc>${siteUrl}${url}</loc>
    <changefreq>${url === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${url === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
