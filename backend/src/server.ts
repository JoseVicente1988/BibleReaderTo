import express from "express";
import cors from "cors";
import bibleRoutes from "./routes/bible";
import { mountSwagger } from "./lib/swagger";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", bibleRoutes);
mountSwagger(app);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend on http://localhost:${PORT} (docs at /docs)`));
