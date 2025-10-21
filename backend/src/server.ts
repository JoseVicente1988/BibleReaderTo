import "dotenv/config";

import express from "express";
import cors from "cors";
import bibleRoutes from "./routes/bible.js";
import { mountSwagger } from "./lib/swagger.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

// Log corto para confirmar que hay API key (enmascarada)
const k = process.env.BIBLE_API_KEY || "";
let mask = "(no-key)";
if (k.length > 0) {
  const first = k.substring(0, 4);
  const last = k.substring(Math.max(0, k.length - 4));
  mask = `${first}…${last}`;
}
console.log(`[env] BIBLE_API_KEY: ${mask}`);
console.log(`[env] BIBLE_ID: ${process.env.BIBLE_ID || "(auto)"}`);

app.use("/api", bibleRoutes);
mountSwagger(app);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend on http://localhost:${PORT} (docs at /docs)`));
