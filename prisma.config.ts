import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // Connexion directe (sans pgbouncer) pour les migrations
    url: env("DATABASE_URL_UNPOOLED"),
  },
});
