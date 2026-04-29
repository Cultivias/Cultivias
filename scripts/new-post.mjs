#!/usr/bin/env node
/**
 * Cultivias Post Generator
 * Usage: node scripts/new-post.mjs
 * Or:    npm run new-post
 */

import { createInterface } from 'readline';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ARTICLES_DIR = join(ROOT, 'src/content/articles');
const AUTHORS_DIR = join(ROOT, 'src/content/authors');

// ── Helpers ──────────────────────────────────────────────────────────────────

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(question, defaultVal = '') {
  return new Promise(resolve => {
    const hint = defaultVal ? ` (zadano: ${defaultVal})` : '';
    rl.question(`${question}${hint}: `, answer => {
      resolve(answer.trim() || defaultVal);
    });
  });
}

function askYesNo(question, defaultVal = false) {
  return new Promise(resolve => {
    const hint = defaultVal ? ' [D/n]' : ' [d/N]';
    rl.question(`${question}${hint}: `, answer => {
      const a = answer.trim().toLowerCase();
      if (!a) resolve(defaultVal);
      else resolve(a === 'd' || a === 'y' || a === 'da' || a === 'yes');
    });
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')    // strip diacritics
    .replace(/[čćšžđ]/g, c => ({ č: 'c', ć: 'c', š: 's', ž: 'z', đ: 'd' }[c] || c))
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function getAuthors() {
  return readdirSync(AUTHORS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const data = JSON.parse(readFileSync(join(AUTHORS_DIR, f), 'utf-8'));
      return { slug: data.slug, name: data.name, role: data.role };
    });
}

function isoDate(d = new Date()) {
  return d.toISOString().split('T')[0];
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

// ── Main ─────────────────────────────────────────────────────────────────────

const CATEGORIES = ['voce', 'povrce', 'bilje', 'vijesti'];
const CATEGORY_LABELS = {
  voce: 'Voće',
  povrce: 'Povrće',
  bilje: 'Bilje / ljekovito bilje',
  vijesti: 'Vijesti',
};

async function main() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  Cultivias — Generator novih članaka  ║');
  console.log('╚══════════════════════════════════════╝\n');

  // ── 1. Title ──────────────────────────────────────────────────────────────
  let title;
  while (!title) {
    title = await ask('Naslov članka');
    if (!title) console.log('  ⚠  Naslov je obavezan.');
  }

  // ── 2. Slug ───────────────────────────────────────────────────────────────
  const suggestedSlug = slugify(title);
  let slug = await ask('URL slug', suggestedSlug);
  slug = slugify(slug) || suggestedSlug;

  // ── 3. Category ───────────────────────────────────────────────────────────
  console.log('\nDostupne kategorije:');
  CATEGORIES.forEach((c, i) => console.log(`  ${i + 1}. ${CATEGORY_LABELS[c]} (${c})`));
  let category;
  while (!category) {
    const raw = await ask('Kategorija (broj ili slug)', '1');
    const idx = parseInt(raw, 10);
    if (idx >= 1 && idx <= CATEGORIES.length) {
      category = CATEGORIES[idx - 1];
    } else if (CATEGORIES.includes(raw)) {
      category = raw;
    } else {
      console.log(`  ⚠  Unesi broj 1–${CATEGORIES.length} ili slug kategorije.`);
    }
  }

  // ── 4. Author ─────────────────────────────────────────────────────────────
  const authors = getAuthors();
  console.log('\nDostupni autori:');
  authors.forEach((a, i) =>
    console.log(`  ${i + 1}. ${a.name} (${a.slug}) — ${a.role}`)
  );
  let authorSlug;
  while (!authorSlug) {
    const raw = await ask('Autor (broj ili slug)', '1');
    const idx = parseInt(raw, 10);
    if (idx >= 1 && idx <= authors.length) {
      authorSlug = authors[idx - 1].slug;
    } else if (authors.find(a => a.slug === raw)) {
      authorSlug = raw;
    } else {
      console.log(`  ⚠  Unesi broj 1–${authors.length} ili slug autora.`);
    }
  }

  // ── 5. Meta ───────────────────────────────────────────────────────────────
  const readTime = await ask('Procijenjeno vrijeme čitanja (min)', '5');
  const perex = await ask('Perex / kratki opis (1–2 rečenice)');
  const imageSlug = await ask('Putanja slike', `/images/articles/${slug}.jpg`);
  const tagsRaw = await ask('Tagovi odvojeni zarezom', `${category}`);
  const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

  // ── 6. Flags ──────────────────────────────────────────────────────────────
  const expertReviewed = await askYesNo('\nStručno provjereno?', false);
  const featured = await askYesNo('Istaknuti članak (featured)?', false);
  const editorsPick = await askYesNo("Urednički izbor (editor's pick)?", false);

  // ── 7. Related articles ───────────────────────────────────────────────────
  const existingArticles = readdirSync(ARTICLES_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));

  let relatedArticles = [];
  if (existingArticles.length > 0) {
    console.log('\nPostojeći članci (za povezane članke):');
    existingArticles.forEach((s, i) => console.log(`  ${pad2(i + 1)}. ${s}`));
    const relRaw = await ask(
      'Povezani članci — upiši slugove odvojene zarezom (ili ostavi prazno)',
      ''
    );
    relatedArticles = relRaw
      .split(',')
      .map(s => s.trim())
      .filter(s => existingArticles.includes(s));
  }

  // ── 8. Generate file ──────────────────────────────────────────────────────
  const today = isoDate();
  const targetDir = ARTICLES_DIR;
  const fileName = `${slug}.md`;
  const filePath = join(targetDir, fileName);

  if (existsSync(filePath)) {
    const overwrite = await askYesNo(
      `\n⚠  Datoteka "${fileName}" već postoji. Prepiši?`,
      false
    );
    if (!overwrite) {
      console.log('\nObustavljen. Datoteka nije promijenjena.\n');
      rl.close();
      return;
    }
  }

  const relatedYaml =
    relatedArticles.length > 0
      ? `related_articles:\n${relatedArticles.map(r => `  - "${r}"`).join('\n')}`
      : `related_articles: []`;

  const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
slug: "${slug}"
category: "${category}"
author: "${authorSlug}"
expert_reviewed: ${expertReviewed}
publishedAt: "${today}"
readTime: ${parseInt(readTime, 10) || 5}
perex: "${(perex || title).replace(/"/g, '\\"')}"
image: "${imageSlug}"
tags: [${tags.map(t => `"${t}"`).join(', ')}]
${relatedYaml}
featured: ${featured}
editors_pick: ${editorsPick}
---

## Uvod

Ovdje upiši uvodni paragraf članka.

## Naslov prve sekcije

Sadržaj prve sekcije...

## Naslov druge sekcije

Sadržaj druge sekcije...

## Zaključak

Završni paragraf s ključnom porukom i pozivom na akciju.
`;

  writeFileSync(filePath, frontmatter, 'utf-8');

  console.log('\n✅ Članak uspješno kreiran!');
  console.log(`   📄 ${filePath}`);
  console.log(`   🔗 URL: /${category}/${slug}/`);
  console.log('\nOtvori datoteku i ispuni sadržaj, zatim pokreni:');
  console.log('   npm run build\n');

  rl.close();
}

main().catch(err => {
  console.error('\n❌ Greška:', err.message);
  rl.close();
  process.exit(1);
});
