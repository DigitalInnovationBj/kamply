// Base Postgres locale en mémoire (PGlite) pour tester sans Neon.
// Usage : node scripts/local-db.mjs  → écoute sur 127.0.0.1:5433
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const db = await PGlite.create();
const dir = "prisma/migrations";
for (const m of readdirSync(dir).filter((d) => !d.endsWith(".toml")).sort()) {
  await db.exec(readFileSync(join(dir, m, "migration.sql"), "utf8"));
  console.log("migration appliquée :", m);
}
const server = new PGLiteSocketServer({ db, port: 5433, host: "127.0.0.1", maxConnections: 50 });
await server.start();
console.log("PGlite prêt sur 127.0.0.1:5433");
