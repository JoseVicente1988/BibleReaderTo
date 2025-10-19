"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

type Verse = { id: string; chapter: number; verse: number; text: string };
type ReadResponse = { book: { id: string; name: string }; totalVerses: number; offset: number; limit: number; items: Verse[] };

const PAGE_SIZE = 20;

export default function BookReader({ params }: { params: { id: string } }) {
  const { id } = params;
  const storageKey = `pos:${id}`;
  const [state, setState] = useState<ReadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async (offset: number) => {
    setLoading(true);
    try {
      const res = await api(`/api/book/${id}/read?offset=${offset}&limit=${PAGE_SIZE}`);
      setState(res.data);
      localStorage.setItem(storageKey, String(offset));
      setErr(null);
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = parseInt(localStorage.getItem(storageKey) || "0", 10) || 0;
    load(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <p>Cargando…</p>;
  if (err) return <p className="text-red-600">Error: {err}</p>;
  if (!state) return <p>Sin datos.</p>;

  const canPrev = state.offset > 0;
  const canNext = state.offset + state.limit < state.totalVerses;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{state.book.name || state.book.id}</h1>
      <div className="prose max-w-none">
        {state.items.map((v) => (
          <p key={v.id}>
            <span className="text-zinc-500 mr-2">{v.chapter}:{v.verse}</span>
            {v.text}
          </p>
        ))}
      </div>
      <div className="flex gap-2">
        <button disabled={!canPrev} onClick={() => load(Math.max(0, state.offset - state.limit))} className="px-3 py-1 rounded bg-zinc-200 disabled:opacity-50">
          ◀ Anterior
        </button>
        <button disabled={!canNext} onClick={() => load(state.offset + state.limit)} className="px-3 py-1 rounded bg-zinc-800 text-white disabled:opacity-50">
          Siguiente ▶
        </button>
        <span className="ml-auto text-sm text-zinc-600">
          {state.offset + 1}–{Math.min(state.offset + state.limit, state.totalVerses)} / {state.totalVerses}
        </span>
      </div>
    </div>
  );
}
