export async function api(path: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
