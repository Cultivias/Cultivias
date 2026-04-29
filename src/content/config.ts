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
    publishedAt: z.string(),
    updatedAt: z.string().optional(),
    readTime: z.number(),
    perex: z.string(),
    image: z.string(),
    tags: z.array(z.string()).default([]),
    related_articles: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    editors_pick: z.boolean().default(false),
  }),
});

export const collections = {
  authors: authorsCollection,
  articles: articlesCollection,
};
