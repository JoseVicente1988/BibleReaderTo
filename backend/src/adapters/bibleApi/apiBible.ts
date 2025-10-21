import type { BibleProvider, Book, ReadResponse, Verse } from "../../lib/types.js";

const API_BASE = "https://api.scripture.api.bible/v1";
const API_KEY = process.env.BIBLE_API_KEY;

// cache simple
let RESOLVED_BIBLE_ID: string | null = process.env.BIBLE_ID ?? null;
let BOOKS_CACHE: Book[] | null = null;

async function api(path: string) {
  if (!API_KEY) throw new Error("BIBLE_API_KEY missing (usa mock o pon la key en .env)");
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { headers: { "api-key": API_KEY, "accept": "application/json" } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API.Bible ${res.status} on ${path}\n${body}`);
  }
  return res.json();
}

async function ensureBibleId(): Promise<string> {
  if (RESOLVED_BIBLE_ID) return RESOLVED_BIBLE_ID;
  const list = await api(`/bibles`);
  if (!Array.isArray(list?.data) || list.data.length === 0) {
    throw new Error("Tu API key no tiene biblias accesibles.");
  }
  RESOLVED_BIBLE_ID = list.data[0].id;
  return RESOLVED_BIBLE_ID!;
}

async function loadBooks(): Promise<Book[]> {
  if (BOOKS_CACHE) return BOOKS_CACHE;
  const bibleId = await ensureBibleId();
  const j = await api(`/bibles/${bibleId}/books`);
  BOOKS_CACHE = (j.data || []).map((b: any) => ({
    id: b.id,
    name: b.name,
    chapters: null
  }));
  return BOOKS_CACHE!;
}

export const apiBibleProvider: BibleProvider = {
  async listBooks(): Promise<Book[]> {
    return loadBooks();
  },

  async getBookMeta(bookId: string): Promise<Book> {
    const bibleId = await ensureBibleId();
    const chaptersResp = await api(`/bibles/${bibleId}/books/${bookId}/chapters`);
    const chapters = Array.isArray(chaptersResp.data) ? chaptersResp.data.length : null;

    const books = await loadBooks();
    const found = books.find(b => b.id === bookId);
    return { id: bookId, name: found?.name || bookId, chapters };
  },

  // Paginación robusta: chapters -> verses por ventana offset/limit
  async readBook(bookId: string, offset: number, limit: number): Promise<ReadResponse> {
    const bibleId = await ensureBibleId();

    const chResp = await api(`/bibles/${bibleId}/books/${bookId}/chapters`);
    const chapters: { id: string }[] = (chResp.data || []).map((c: any) => ({ id: c.id }));
    if (!chapters.length) throw new Error(`No hay capítulos para el libro ${bookId} en esta Biblia.`);

    // Preconteo de versos y listado de ids por capítulo
    let totalVerses = 0;
    const chapterVerseIds: string[][] = [];
    for (const ch of chapters) {
      const vMeta = await api(`/bibles/${bibleId}/chapters/${ch.id}/verses`);
      const ids = (vMeta.data || []).map((v: any) => v.id);
      totalVerses += ids.length;
      chapterVerseIds.push(ids);
    }

    // Extraer ventana offset..offset+limit
    const items: Verse[] = [];
    let skipped = 0;
    for (const ids of chapterVerseIds) {
      if (items.length >= limit) break;
      if (skipped + ids.length <= offset) {
        skipped += ids.length;
        continue;
      }
      const start = Math.max(0, offset - skipped);
      const take = Math.min(limit - items.length, ids.length - start);
      const slice = ids.slice(start, start + take);

      for (const vId of slice) {
        let d: any;
        try {
          const v = await api(`/bibles/${bibleId}/verses/${vId}?content-type=text`);
          d = v.data;
        } catch {
          const v = await api(`/bibles/${bibleId}/verses/${vId}`);
          d = v.data;
        }
        const ref = String(d.reference || "");
        items.push({
          id: d.id,
          bookId,
          chapter: parseInt(ref.split(":")[0].split(".")[1] || "1", 10) || 1,
          verse: parseInt(ref.split(":")[1] || "1", 10) || 1,
          text: (d.content || d.text || "").replace(/<[^>]+>/g, "")
        });
      }
      skipped += ids.length;
    }

    const book = await this.getBookMeta(bookId);
    return { book, totalVerses, offset, limit, items };
  },
};
