import { BibleProvider } from "../../lib/types";
import { apiBibleProvider } from "./apiBible";
import { mockProvider } from "./mock";

export function getProvider(): BibleProvider {
  if (!process.env.BIBLE_API_KEY) return mockProvider;
  return apiBibleProvider;
}
