import { BibleProvider, Book, ReadResponse, Verse } from "../../lib/types";
import fetch from "node-fetch";

const API_BASE = "https://api.scripture.api.bible/v1";
const DEFAULT_BIBLE_ID = process.env.BIBLE_ID ?? "de4e12af7f28f599-02";
const API_KEY = process.env.BIBLE_API_KEY;

async function api(path: string) {
  if (!API_KEY) throw new Error("BIBLE_API_KEY missing (switch to mock or set key)");
  const res = await fetch(`${API_BASE}${path}`, { headers: { "api-key": API_KEY } });
  if (!res.ok) throw new Error(`API.Bible error ${res.status}`);
  return res.json();
}

export const apiBibleProvider: BibleProvider = {
  async listBooks(): Promise<Book[]> {
    const j = await api(`/bibles/${DEFAULT_BIBLE_ID}/books`);
    return (j.data || []).map((b: any) => ({ id: b.id, name: b.name, chapters: null }));
  },
  async getBookMeta(bookId: string): Promise<Book> {
    const j = await api(`/bibles/${DEFAULT_BIBLE_ID}/books/${bookId}/chapters`);
    const chapters = Array.isArray(j.data) ? j.data.length : null;
    return { id: bookId, name: bookId, chapters };
  },
  async readBook(bookId: string, offset: number, limit: number): Promise<ReadResponse> {
    const verses = await api(`/bibles/${DEFAULT_BIBLE_ID}/verses?bookId=${bookId}&offset=${offset}&limit=${limit}`);
    const items: Verse[] = (verses.data || []).map((v: any) => ({
      id: v.id,
      bookId,
      chapter: parseInt(v.reference?.split(":")[0]?.split(".")[1] || "1", 10) || 1,
      verse: parseInt(v.reference?.split(":")[1] || "1", 10) || 1,
      text: (v.content || v.text || "").replace(/<[^>]+>/g, ""),
    }));
    const total = (verses.meta && verses.meta.pagination && verses.meta.pagination.total) ? verses.meta.pagination.total : (offset + items.length);
    const book = await this.getBookMeta(bookId);
    return { book, totalVerses: total, offset, limit, items };
  },
};
