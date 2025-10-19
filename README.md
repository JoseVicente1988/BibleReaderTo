# Bible Reader (Node.js + Next.js)

Web para leer libros de la Biblia con paginación por versículos.

## APIs
- A: API.Bible — requiere API key. Docs: https://docs.api.bible/
- B: Mock local — sin key, útil para desarrollo.

## Variables
Copia `.env.example` a `.env`. Sin `BIBLE_API_KEY` el backend usa **mock**.

## Quickstart
```bash
# 1) Instalar deps
npm --prefix backend i && npm --prefix frontend i

# 2) Backend dev
npm --prefix backend run dev

# 3) Frontend dev (otra terminal)
npm --prefix frontend run dev

# 4) Probar health
curl http://localhost:3001/health

# 5) Abrir web
http://localhost:3000

# 6) Docker (prod)
docker compose up --build
```

## Endpoints
- `GET /api/books`
- `GET /api/book/:id`
- `GET /api/book/:id/read?offset=0&limit=20`

## Validaciones
1) La app levanta y `/api/books` devuelve 200 y lista (en mock verás *Genesis*).
2) En `/book/GEN` la paginación funciona y recuerda la posición.
3) Tests mínimos (backend y frontend) pasan.
