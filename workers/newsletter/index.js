const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);

    let email, name;
    try {
      ({ email, name } = await request.json());
    } catch {
      return json({ error: 'Neispravan zahtjev' }, 400);
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Neispravan e-mail' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const timestamp = new Date().toISOString();
    const safeEmail = normalizedEmail.replace(/[^a-z0-9]/g, '-');
    const filename = `src/content/newsletter/${timestamp.slice(0, 10)}-${safeEmail}.json`;

    const fileContent = JSON.stringify(
      { email: normalizedEmail, name: (name || '').trim(), subscribedAt: timestamp },
      null,
      2
    );

    const ghRes = await fetch(
      `https://api.github.com/repos/Cultivias2026/Cultivias-Cultivias/contents/${filename}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Cultivias-Newsletter-Worker/1.0',
        },
        body: JSON.stringify({
          message: `newsletter: nova pretplata (${normalizedEmail}) [skip ci]`,
          content: btoa(unescape(encodeURIComponent(fileContent))),
        }),
      }
    );

    // 422 = datoteka već postoji (isti email isti dan)
    if (ghRes.status === 422) return json({ success: true });
    if (!ghRes.ok) return json({ error: 'Greška pri pohrani' }, 500);

    return json({ success: true });
  },
};
