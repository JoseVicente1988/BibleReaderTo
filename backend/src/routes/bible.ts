// path: backend/src/routes/bible.ts  (al final del archivo, antes de export default r)
r.get("/_debug", asyncH(async (_req, res) => {
  const key = process.env.BIBLE_API_KEY;
  if (!key) return res.json({ provider: "mock", note: "No BIBLE_API_KEY, usando mock." });

  // Llama a /bibles para listar accesibles con TU key
  const fetch = (await import("node-fetch")).default as any;
  const API_BASE = "https://api.scripture.api.bible/v1";
  const r1 = await fetch(`${API_BASE}/bibles`, { headers: { "api-key": key } });
  const list = r1.ok ? await r1.json() : { error: `${r1.status}` };

  const bibleId = process.env.BIBLE_ID || null;
  let chosen: any = null;
  if (bibleId && list?.data) {
    chosen = list.data.find((b: any) => b.id === bibleId) || null;
  }

  res.json({
    provider: "apiBible",
    BIBLE_ID: bibleId,
    bible_found: Boolean(chosen),
    bibles_count: Array.isArray(list?.data) ? list.data.length : 0,
    sample_bibles: Array.isArray(list?.data) ? list.data.slice(0, 5) : list
  });
}));
