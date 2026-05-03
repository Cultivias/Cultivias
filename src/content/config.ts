import { defineCollection, z } from 'astro:content';

const authorsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    title: z.string(),
    role: z.enum(['expert', 'editor']),
    bio_short: z.string(),
    bio_long: z.string(),
    avatar: z.string(),
    expertise: z.array(z.string()).optional(),
    social: z.object({
      linkedin: z.string().optional(),
      web: z.string().optional(),
      email: z.string().optional(),
    }).optional(),
  }),
});

const articlesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.enum(['voce', 'povrce', 'bilje', 'vijesti']),
    author: z.string(), // slug autora
    expert_reviewed: z.boolean().default(false),
    publishedAt: z.union([z.string(), z.date()]).transform(v =>
      v instanceof Date ? v.toISOString().split('T')[0] : v
    ),
    updatedAt: z.union([z.string(), z.date()]).nullable().optional().transform(v =>
      v instanceof Date ? v.toISOString().split('T')[0] : (v ?? undefined)
    ),
    readTime: z.number(),
    perex: z.string(),
    image: z.string(),
    tags: z.array(z.string()).default([]),
    related_articles: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    editors_pick: z.boolean().default(false),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    canonicalUrl: z.string().optional(),
    ogImage: z.string().optional(),
    noindex: z.boolean().default(false),
  }),
});

const settingsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    siteName: z.string(),
    tagline: z.string(),
    description: z.string(),
    colorPrimary: z.string(),
    colorPrimaryDark: z.string(),
    colorAccent: z.string(),
    colorAccentDark: z.string(),
    colorDark: z.string(),
    colorBgMint: z.string(),
    colorBgPale: z.string(),
    navLinks: z.array(z.object({ label: z.string(), href: z.string() })),
    social: z.object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      youtube: z.string().optional(),
    }),
    footerCopyright: z.string(),
    footerTagline: z.string(),
    newsletterHeading: z.string(),
    newsletterSubtext: z.string(),
    newsletterNote: z.string(),
  }),
});

const pagesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
    noindex: z.boolean().default(false),
    showInNav: z.boolean().default(false),
  }),
});

export const collections = {
  authors: authorsCollection,
  articles: articlesCollection,
  settings: settingsCollection,
  pages: pagesCollection,
};
