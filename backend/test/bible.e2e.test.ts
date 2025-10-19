import { describe, it, expect } from "vitest";
import { mockProvider } from "../src/adapters/bibleApi/mock";

describe("mock provider", () => {
  it("paginates verses", async () => {
    const r = await mockProvider.readBook("GEN", 0, 5);
    expect(r.items.length).toBe(5);
    const r2 = await mockProvider.readBook("GEN", 5, 5);
    expect(r2.items[0].verse).toBe(6);
  });
});
