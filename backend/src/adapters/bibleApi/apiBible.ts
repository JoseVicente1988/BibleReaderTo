// path: backend/src/adapters/bibleApi/apiBible.ts
import { BibleProvider, Book, ReadResponse, Verse } from "../../lib/types";
import fetch from "node-fetch";

const API_BASE = "https://api.scripture.api.bible/v1";
const DEFAULT_BIBLE_ID = process.env.BIBLE_ID ?? "a6aee10bb058511c-02"; // KJV de los ejemplos oficiales
const API_KEY = process.env.BIBLE_API_KEY;

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

// Utilidades “oficiales”: books -> chapters -> verses
// Docs: /bibles/{bibleId}/books, /bibles/{bibleId}/books/{bookId}/chapters,
//       /bibles/{bibleId}/chapters/{chapterId}/verses, /verses/{verseId} :contentReference[oaicite:1]{index=1}

export const apiBibleProvider: BibleProvider = {
  async listBooks(): Promise<Book[]> {
    const j = await api(`/bibles/${DEFAULT_BIBLE_ID}/books`);
    return (j.data || []).map((b: any) => ({
      id: b.id,             // p.ej. GEN, EXO, JHN
      name: b.name,         // “Genesis”, “Exodus”, “John”
      chapters: null
    }));
  },

  async getBookMeta(bookId: string): Promise<Book> {
    const chaptersResp = await api(`/bibles/${DEFAULT_BIBLE_ID}/books/${bookId}/chapters`);
    const chapters = Array.isArray(chaptersResp.data) ? chaptersResp.data.length : null;

    // Si el nombre no viene aquí, recupéralo de la lista de libros
    let name = bookId;
    try {
      const books = await this.listBooks();
      const found = books.find(b => b.id === bookId);
      if (found) name = found.name;
    } catch { /* no-op */ }

    return { id: bookId, name, chapters };
  },

  // Paginación por libro: “aplano” capítulo a capítulo hasta cubrir offset/limit
  async readBook(bookId: string, offset: number, limit: number): Promise<ReadResponse> {
    // 1) Lista de capítulos del libro
    const chResp = await api(`/bibles/${DEFAULT_BIBLE_ID}/books/${bookId}/chapters`);
    const chapters: { id: string }[] = (chResp.data || []).map((c: any) => ({ id: c.id }));
    if (!chapters.length) throw new Error(`No chapters for book ${bookId}`);

    // 2) Necesitamos saber cuántos versos totales para calcular canNext
    //    Estrategia: sumo tamaños por capítulo hasta que sea necesario.
    const items: Verse[] = [];
    let totalVerses = 0;

    // pre-scan ligero para total (si quieres máximo rendimiento, cachea)
    for (const ch of chapters) {
      const vMeta = await api(`/bibles/${DEFAULT_BIBLE_ID}/chapters/${ch.id}/verses`);
      const count = Array.isArray(vMeta.data) ? vMeta.data.length : 0;
      totalVerses += count;
    }

    // 3) Extraer “segmento” [offset, offset+limit) cruzando capítulos
    let consumed = 0;       // versos ya saltados
    let collected = 0;      // versos añadidos al resultado
    for (const ch of chapters) {
      if (collected >= limit) break;

      const vMeta = await api(`/bibles/${DEFAULT_BIBLE_ID}/chapters/${ch.id}/verses`);
      const verseIds: string[] = (vMeta.data || []).map((v: any) => v.id);
      const chCount = verseIds.length;

      // Si todavía no llegamos al offset, saltar capítulos enteros
      if (consumed + chCount <= offset) {
        consumed += chCount;
        continue;
      }

      // Dentro del capítulo, calcular desde-dónde y cuántos coger
      const startInChapter = Math.max(0, offset - consumed);
      const remaining = limit - collected;
      const take = Math.min(remaining, chCount - startInChapter);

      const sliceIds = verseIds.slice(startInChapter, startInChapter + take);

      // 4) Obtener el contenido de cada verso (texto plano)
      //    (podrías paralelizar con Promise.all si lo prefieres)
      for (const vId of sliceIds) {
        const v = await api(`/bibles/${DEFAULT_BIBLE_ID}/verses/${vId}?content-type=text`); // text sin HTML
        const d = v.data;
        items.push({
          id: d.id,
          bookId,
          chapter: parseInt(String(d.reference || "").split(":")[0].split(".")[1] || "1", 10) || 1,
          verse: parseInt(String(d.reference || "").split(":")[1] || "1", 10) || 1,
          text: d.content || ""
        });
        collected++;
      }

      consumed += chCount;
    }

    const book = await this.getBookMeta(bookId);
    return { book, totalVerses, offset, limit, items };
  },
};
