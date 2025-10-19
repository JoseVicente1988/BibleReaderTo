// path: backend/src/adapters/bibleApi/apiBible.ts
import { BibleProvider, Book, ReadResponse, Verse } from "../../lib/types";
import fetch from "node-fetch";

const API_BASE = "https://api.scripture.api.bible/v1";
const API_KEY = process.env.BIBLE_API_KEY;
let RESOLVED_BIBLE_ID: string | null = process.env.BIBLE_ID ?? null;

async function api(path: string) {
  if (!API_KEY) throw new Error("BIBLE_API_KEY missing (switch to mock or set key)");
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { headers: { "api-key": API_KEY } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API.Bible ${res.status} on ${path} :: ${body}`);
  }
  return res.json();
}

// Descubre una Biblia válida si no hay o si falla la actual.
async function ensureBibleId(): Promise<string> {
  if (RESOLVED_BIBLE_ID) return RESOLVED_BIBLE_ID;
  const list = await api(`/bibles`);
  if (!Array.isArray(list?.data) || list.data.length === 0) {
    throw new Error("No accessible bibles for this API key");
  }
  RESOLVED_BIBLE_ID = list.data[0].id;
  return RESOLVED_BIBLE_ID!;
}

export const apiBibleProvider: BibleProvider = {
  async listBooks(): Promise<Book[]> {
    const bibleId = await ensureBibleId();
    const j = await api(`/bibles/${bibleId}/books`);
    return (j.data || []).map((b: any) => ({ id: b.id, name: b.name, chapters: null }));
  },

  async getBookMeta(bookId: string): Promise<Book> {
    const bibleId = await ensureBibleId();
    const chaptersResp = await api(`/bibles/${bibleId}/books/${bookId}/chapters`);
    const chapters = Array.isArray(chaptersResp.data) ? chaptersResp.data.length : null;

    // nombre “bonito”
    try {
      const books = await this.listBooks();
      const found = books.find(b => b.id === bookId);
      return { id: bookId, name: found?.name || bookId, chapters };
    } catch {
      return { id: bookId, name: bookId, chapters };
    }
  },

  // Paginación robusta: books -> chapters -> verses (texto plano)
  async readBook(bookId: string, offset: number, limit: number): Promise<ReadResponse> {
    const bibleId = await ensureBibleId();

    const chResp = await api(`/bibles/${bibleId}/books/${bookId}/chapters`);
    const chapters: { id: string }[] = (chResp.data || []).map((c: any) => ({ id: c.id }));
    if (!chapters.length) throw new Error(`No chapters for book ${bookId}`);

    // contabilizar total (simple; ideal: cache)
    let totalVerses = 0;
    const chapterVerseIds: string[][] = [];
    for (const ch of chapters) {
      const vMeta = await api(`/bibles/${bibleId}/chapters/${ch.id}/verses`);
      const ids = (vMeta.data || []).map((v: any) => v.id);
      totalVerses += ids.length;
      chapterVerseIds.push(ids);
    }

    // extraer ventana offset..offset+limit
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
        const v = await api(`/bibles/${bibleId}/verses/${vId}?content-type=text`);
        const d = v.data;
        items.push({
          id: d.id,
          bookId,
          chapter: parseInt(String(d.reference || "").split(":")[0].split(".")[1] || "1", 10) || 1,
          verse: parseInt(String(d.reference || "").split(":")[1] || "1", 10) || 1,
          text: d.content || ""
        });
      }
      skipped += ids.length;
    }

    const book = await this.getBookMeta(bookId);
    return { book, totalVerses, offset, limit, items };
  },
};
