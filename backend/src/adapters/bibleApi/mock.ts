import { BibleProvider, Book, ReadResponse, Verse } from "../../lib/types";

const MOCK_BOOK: Book = { id: "GEN", name: "Genesis", chapters: 50 };
const MOCK_VERSES: Verse[] = Array.from({ length: 30 }).map((_, i) => ({
  id: `GEN.1.${i + 1}`,
  bookId: "GEN",
  chapter: 1,
  verse: i + 1,
  text: `Genesis 1:${i + 1} — mock verse text.`,
}));

export const mockProvider: BibleProvider = {
  async listBooks(): Promise<Book[]> {
    return [MOCK_BOOK];
  },
  async getBookMeta(bookId: string): Promise<Book> {
    if (bookId !== "GEN") throw new Error("mock only supports GEN");
    return MOCK_BOOK;
  },
  async readBook(bookId: string, offset: number, limit: number): Promise<ReadResponse> {
    if (bookId !== "GEN") throw new Error("mock only supports GEN");
    const slice = MOCK_VERSES.slice(offset, offset + limit);
    return { book: MOCK_BOOK, totalVerses: MOCK_VERSES.length, offset, limit, items: slice };
  },
};
