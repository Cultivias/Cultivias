#!/usr/bin/env node
/**
 * Cultivias Admin — lokalni server za kreiranje članaka
 * Pokretanje: npm run admin
 * Otvori:    http://localhost:3001
 */

import { createServer } from 'http';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseQS } from 'querystring';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT     = resolve(__dirname, '..');
const ARTICLES = join(ROOT, 'src/content/articles');
const AUTHORS  = join(ROOT, 'src/content/authors');
const PORT     = 3001;

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/č/g,'c').replace(/ć/g,'c').replace(/š/g,'s')
    .replace(/ž/g,'z').replace(/đ/g,'d')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

function isoDate() {
  return new Date().toISOString().split('T')[0];
}

function getAuthors() {
  return readdirSync(AUTHORS)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(readFileSync(join(AUTHORS, f), 'utf-8')))
    .map(a => ({ slug: a.slug, name: a.name, role: a.role }));
}

function getArticleSlugs() {
  return readdirSync(ARTICLES)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));
}

function escapeHtml(s = '') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const CATEGORIES = [
  { slug: 'voce',    label: 'Voće' },
  { slug: 'povrce',  label: 'Povrće' },
  { slug: 'bilje',   label: 'Bilje / ljekovito bilje' },
  { slug: 'vijesti', label: 'Vijesti' },
];

// ── HTML template ─────────────────────────────────────────────────────────────

function renderForm({ message = '', error = '', values = {} } = {}) {
  const authors  = getAuthors();
  const articles = getArticleSlugs();

  const authorOptions = authors.map(a =>
    `<option value="${a.slug}" ${values.author === a.slug ? 'selected' : ''}>${escapeHtml(a.name)} (${a.role})</option>`
  ).join('\n');

  const categoryOptions = CATEGORIES.map(c =>
    `<option value="${c.slug}" ${values.category === c.slug ? 'selected' : ''}>${c.label}</option>`
  ).join('\n');

  const relatedCheckboxes = articles.length
    ? articles.map(s =>
        `<label class="related-item">
          <input type="checkbox" name="related" value="${s}" ${(values.related || []).includes(s) ? 'checked' : ''}>
          <span>${s}</span>
        </label>`
      ).join('\n')
    : '<p class="muted">Još nema objavljenih članaka.</p>';

  const successBanner = message
    ? `<div class="banner success">✅ ${escapeHtml(message)}</div>` : '';
  const errorBanner = error
    ? `<div class="banner error">⚠️ ${escapeHtml(error)}</div>` : '';

  return `<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Cultivias — Novi članak</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Inter, system-ui, sans-serif;
      background: #f0f7f1;
      color: #222;
      min-height: 100vh;
    }
    header {
      background: #06140C;
      color: #fff;
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    header .logo { font-size: 1.25rem; font-weight: 700; color: #5cab88; letter-spacing: -.5px; }
    header .subtitle { font-size: .8rem; color: #aaa; }
    main { max-width: 760px; margin: 2rem auto; padding: 0 1rem 4rem; }
    h1 { font-size: 1.5rem; font-weight: 700; color: #06140C; margin-bottom: 1.5rem; }
    .banner {
      border-radius: 10px;
      padding: .9rem 1.2rem;
      margin-bottom: 1.5rem;
      font-weight: 500;
    }
    .banner.success { background: #d4f3d7; color: #1a5e30; border: 1px solid #5cab88; }
    .banner.error   { background: #fde8e8; color: #7b1c1c; border: 1px solid #e57373; }
    .banner a { color: inherit; font-weight: 700; }
    .card {
      background: #fff;
      border: 1px solid #D4F3D7;
      border-radius: 14px;
      padding: 1.75rem;
      margin-bottom: 1.25rem;
    }
    .card h2 { font-size: .8rem; font-weight: 700; text-transform: uppercase;
               letter-spacing: .08em; color: #5cab88; margin-bottom: 1.25rem; }
    .field { margin-bottom: 1.1rem; }
    .field label { display: block; font-size: .85rem; font-weight: 600;
                   color: #444; margin-bottom: .35rem; }
    .field input[type=text],
    .field input[type=number],
    .field textarea,
    .field select {
      width: 100%;
      padding: .6rem .85rem;
      border: 1px solid #cde8d0;
      border-radius: 8px;
      font-size: .95rem;
      color: #222;
      background: #fafffe;
      transition: border-color .15s;
      outline: none;
    }
    .field input:focus,
    .field textarea:focus,
    .field select:focus { border-color: #5cab88; box-shadow: 0 0 0 3px rgba(92,171,136,.15); }
    .field textarea { resize: vertical; min-height: 90px; }
    .hint { font-size: .78rem; color: #888; margin-top: .3rem; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .checks { display: flex; gap: 1.5rem; flex-wrap: wrap; margin-top: .4rem; }
    .checks label { display: flex; align-items: center; gap: .45rem;
                    font-size: .9rem; cursor: pointer; }
    .checks input[type=checkbox] { width: 16px; height: 16px; accent-color: #5cab88; }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: .5rem; margin-top: .5rem; }
    .related-item { display: flex; align-items: center; gap: .4rem; font-size: .82rem;
                    background: #f0f7f1; border-radius: 6px; padding: .3rem .6rem; }
    .related-item input { accent-color: #5cab88; }
    .muted { font-size: .85rem; color: #aaa; }
    .btn-submit {
      display: block;
      width: 100%;
      padding: .9rem;
      background: #5cab88;
      color: #fff;
      font-size: 1rem;
      font-weight: 700;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      letter-spacing: .01em;
      transition: background .15s;
      margin-top: .5rem;
    }
    .btn-submit:hover { background: #3d8a67; }
    #slug-field { color: #3d8a67; font-weight: 600; }
  </style>
</head>
<body>
  <header>
    <div>
      <div class="logo">Cultivias</div>
      <div class="subtitle">Admin — lokalni razvojni alat</div>
    </div>
  </header>

  <main>
    <h1>Dodaj novi članak</h1>

    ${successBanner}
    ${errorBanner}

    <form method="POST" action="/" id="articleForm">

      <div class="card">
        <h2>Osnovno</h2>

        <div class="field">
          <label for="title">Naslov *</label>
          <input type="text" id="title" name="title"
                 value="${escapeHtml(values.title || '')}"
                 placeholder="npr. Kako uzgojiti rajčice kod kuće" required
                 oninput="autoSlug(this.value)">
        </div>

        <div class="row">
          <div class="field">
            <label for="slug">URL slug *</label>
            <input type="text" id="slug" name="slug"
                   id="slug-field"
                   value="${escapeHtml(values.slug || '')}"
                   placeholder="kako-uzgojiti-rajcice" required>
            <div class="hint">Automatski generiran iz naslova — možeš urediti</div>
          </div>
          <div class="field">
            <label for="readTime">Čitanje (minute)</label>
            <input type="number" id="readTime" name="readTime"
                   value="${escapeHtml(values.readTime || '5')}" min="1" max="60">
          </div>
        </div>

        <div class="row">
          <div class="field">
            <label for="category">Kategorija *</label>
            <select id="category" name="category" required>
              ${categoryOptions}
            </select>
          </div>
          <div class="field">
            <label for="author">Autor *</label>
            <select id="author" name="author" required>
              ${authorOptions}
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Sadržaj i mediji</h2>

        <div class="field">
          <label for="perex">Perex (kratki opis) *</label>
          <textarea id="perex" name="perex"
                    placeholder="1–2 rečenice kojima privučeš čitatelja..."
                    required>${escapeHtml(values.perex || '')}</textarea>
        </div>

        <div class="field">
          <label for="image">Naslovna slika (putanja)</label>
          <input type="text" id="image" name="image"
                 value="${escapeHtml(values.image || '')}"
                 placeholder="/images/articles/slug-clanka.jpg">
          <div class="hint">Spremi sliku u public/images/articles/ s istim imenom</div>
        </div>

        <div class="field">
          <label for="tags">Tagovi</label>
          <input type="text" id="tags" name="tags"
                 value="${escapeHtml(values.tags || '')}"
                 placeholder="uzgoj, rajcica, povrce">
          <div class="hint">Odvojeni zarezom</div>
        </div>
      </div>

      <div class="card">
        <h2>Opcije</h2>
        <div class="checks">
          <label>
            <input type="checkbox" name="expert_reviewed" value="true"
                   ${values.expert_reviewed ? 'checked' : ''}>
            Stručno provjereno
          </label>
          <label>
            <input type="checkbox" name="featured" value="true"
                   ${values.featured ? 'checked' : ''}>
            Istaknuti članak
          </label>
          <label>
            <input type="checkbox" name="editors_pick" value="true"
                   ${values.editors_pick ? 'checked' : ''}>
            Urednički izbor
          </label>
        </div>
      </div>

      <div class="card">
        <h2>Povezani članci</h2>
        <div class="related-grid">
          ${relatedCheckboxes}
        </div>
      </div>

      <button type="submit" class="btn-submit">Kreiraj članak →</button>
    </form>
  </main>

  <script>
    function slugify(text) {
      const map = { č:'c', ć:'c', š:'s', ž:'z', đ:'d' };
      return text.toLowerCase()
        .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
        .replace(/[čćšžđ]/g, c => map[c] || c)
        .replace(/[^a-z0-9\\s-]/g, '')
        .trim().replace(/\\s+/g, '-').replace(/-+/g, '-');
    }
    function autoSlug(title) {
      const slugEl = document.getElementById('slug');
      // Only auto-fill if user hasn't manually edited the slug
      if (!slugEl.dataset.manual) {
        slugEl.value = slugify(title);
      }
    }
    document.getElementById('slug').addEventListener('input', function() {
      this.dataset.manual = '1';
    });
    // Auto-fill image path from slug
    document.getElementById('slug').addEventListener('blur', function() {
      const imgEl = document.getElementById('image');
      if (!imgEl.value) {
        imgEl.value = '/images/articles/' + this.value + '.jpg';
      }
    });
  </script>
</body>
</html>`;
}

// ── Request handler ───────────────────────────────────────────────────────────

function parseBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => resolve(parseQS(body)));
  });
}

function createArticle(fields) {
  const title   = (fields.title || '').trim();
  const slug    = slugify((fields.slug || '').trim() || title);
  const cat     = fields.category || 'vijesti';
  const author  = fields.author || 'redakcija';
  const perex   = (fields.perex || title).trim();
  const image   = (fields.image || `/images/articles/${slug}.jpg`).trim();
  const readTime = parseInt(fields.readTime, 10) || 5;

  const tags = (fields.tags || cat)
    .split(',').map(t => t.trim()).filter(Boolean);

  const expertReviewed = fields.expert_reviewed === 'true';
  const featured       = fields.featured === 'true';
  const editorsPick    = fields.editors_pick === 'true';

  // related can be array or string
  const relRaw = fields.related || [];
  const related = Array.isArray(relRaw) ? relRaw : [relRaw];
  const existingArticles = getArticleSlugs();
  const relatedFiltered = related.filter(r => existingArticles.includes(r));

  if (!title) throw new Error('Naslov je obavezan.');
  if (!slug)  throw new Error('Slug je obavezan.');

  const filePath = join(ARTICLES, `${slug}.md`);
  if (existsSync(filePath)) throw new Error(`Članak s ovim slugom već postoji: ${slug}.md`);

  const relatedYaml = relatedFiltered.length
    ? `related_articles:\n${relatedFiltered.map(r => `  - "${r}"`).join('\n')}`
    : `related_articles: []`;

  const content = `---
title: "${title.replace(/"/g, '\\"')}"
slug: "${slug}"
category: "${cat}"
author: "${author}"
expert_reviewed: ${expertReviewed}
publishedAt: "${isoDate()}"
readTime: ${readTime}
perex: "${perex.replace(/"/g, '\\"')}"
image: "${image}"
tags: [${tags.map(t => `"${t}"`).join(', ')}]
${relatedYaml}
featured: ${featured}
editors_pick: ${editorsPick}
---

## Uvod

Ovdje upiši uvodni paragraf članka.

## Naslov prve sekcije

Sadržaj prve sekcije...

## Zaključak

Završni paragraf s ključnom porukom i pozivom na akciju.
`;

  writeFileSync(filePath, content, 'utf-8');
  return { slug, category: cat, filePath };
}

// ── HTTP Server ───────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderForm());
    return;
  }

  if (req.method === 'POST' && url.pathname === '/') {
    const fields = await parseBody(req);
    try {
      const { slug, category, filePath } = createArticle(fields);
      const successMsg = `Članak kreiran: src/content/articles/${slug}.md  →  /${category}/${slug}/`;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderForm({ message: successMsg }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      // pass submitted values back so form stays filled
      const values = await parseBody(req).catch(() => ({}));
      res.end(renderForm({ error: err.message, values: fields }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  Cultivias Admin                       ║');
  console.log(`║  http://localhost:${PORT}                  ║`);
  console.log('║  Zatvori: Ctrl+C                       ║');
  console.log('╚════════════════════════════════════════╝\n');
});
