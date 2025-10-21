import type { BibleProvider } from "../../lib/types.js";
import { apiBibleProvider } from "./apiBible.js";
import { mockProvider } from "./mock.js";

export function getProvider(): BibleProvider {
  if (!process.env.BIBLE_API_KEY) return mockProvider;
  return apiBibleProvider;
}
