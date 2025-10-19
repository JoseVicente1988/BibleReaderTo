import swaggerUi from "swagger-ui-express";
import { Router } from "express";

export const openapiDoc = {
  openapi: "3.0.0",
  info: { title: "Bible Reader API", version: "1.0.0" },
  paths: {
    "/api/books": { get: { summary: "List books", responses: { "200": { description: "OK" } } } },
    "/api/book/{id}": {
      get: {
        summary: "Book meta",
        parameters: [{ name: "id", in: "path", required: true }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/book/{id}/read": {
      get: {
        summary: "Read paginated (verses)",
        parameters: [
          { name: "id", in: "path", required: true },
          { name: "offset", in: "query" },
          { name: "limit", in: "query" },
        ],
        responses: { "200": { description: "OK" } },
      },
    },
  },
};

export function mountSwagger(r: Router) {
  r.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc as any));
}
