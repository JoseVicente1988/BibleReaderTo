export type Verse = { id: string; bookId: string; chapter: number; verse: number; text: string };
export type Book = { id: string; name: string; chapters: number | null };
export type ReadResponse = { book: Book; totalVerses: number; offset: number; limit: number; items: Verse[] };

export interface BibleProvider {
  listBooks(): Promise<Book[]>;
  getBookMeta(bookId: string): Promise<Book>;
  readBook(bookId: string, offset: number, limit: number): Promise<ReadResponse>;
}
