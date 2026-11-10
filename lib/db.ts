// Conexão Postgres via Drizzle. Retorna null quando DATABASE_URL não está
// configurada — nesse caso a API usa o armazenamento em memória (lib/store.ts).
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let pool: Pool | null = null;
export function getPool(): Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!pool) pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  return pool;
}
export function getDb() {
  const p = getPool();
  if (!p) return null;
  return drizzle(p, { schema });
}
export const dbConfigured = () => Boolean(process.env.DATABASE_URL);
