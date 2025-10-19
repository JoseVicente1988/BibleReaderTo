import "./globals.css";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900">
        <main className="mx-auto max-w-3xl p-4">{children}</main>
      </body>
    </html>
  );
}
