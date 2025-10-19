"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";

type Book = { id: string; name: string; chapters: number | null };

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api("/api/books")
      .then((r) => setBooks(r.data))
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando libros…</p>;
  if (err) return <p className="text-red-600">Error: {err}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Libros</h1>
      <ul className="space-y-2">
        {books.map((b) => (
          <li key={b.id}>
            <Link className="text-blue-700 underline" href={`/book/${b.id}`}>
              {b.name || b.id}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
