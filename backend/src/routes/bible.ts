import { Router } from "express";
import { asyncH } from "../lib/http.js";
import { getProvider } from "../adapters/bibleApi/index.js";

const r = Router();
const provider = getProvider();

r.get("/books", asyncH(async (_req, res) => {
  const data = await provider.listBooks();
  res.json({ data });
}));

r.get("/book/:id", asyncH(async (req, res) => {
  const book = await provider.getBookMeta(req.params.id);
  res.json({ data: book });
}));

r.get("/book/:id/read", asyncH(async (req, res) => {
  const { id } = req.params;
  const offset = parseInt(String(req.query.offset ?? "0"), 10) || 0;
  const limit = Math.min(parseInt(String(req.query.limit ?? process.env.PAGE_SIZE ?? "20"), 10) || 20, 200);
  const data = await provider.readBook(id, offset, limit);
  res.json({ data });
}));

export default r;
