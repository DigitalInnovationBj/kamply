import "server-only";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** `sslmode=require` est déjà traité comme `verify-full` par pg : on l'écrit explicitement (supprime l'avertissement). */
function withStrictSsl(url: string) {
  return url.replace(/([?&])sslmode=(?:prefer|require|verify-ca)\b/, "$1sslmode=verify-full");
}

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL manquant");
  const pool = new Pool({
    connectionString: withStrictSsl(connectionString),
    max: Number(process.env.DATABASE_POOL_MAX) || 5,
    // Neon ferme les connexions inactives et peut mettre quelques secondes à réveiller la base.
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 15_000,
    keepAlive: true,
  });
  // Ferme proprement les connexions inactives avant que Vercel ne suspende la fonction.
  attachDatabasePool(pool);
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

/** Client Prisma unique par instance (réutilisé entre les rechargements en développement). */
export const db = globalForPrisma.prisma ?? createClient();
globalForPrisma.prisma = db;
