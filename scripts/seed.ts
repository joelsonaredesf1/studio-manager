// Seed do Postgres para o Studio Werner (versão para hospedagem).
// Uso:  DATABASE_URL="postgres://..." npm run db:seed
// Cria as 28 tabelas (drizzle/0001_init.sql) se preciso e insere os dados
// iniciais de forma idempotente (segunda chamada não duplica): 4 perfis com
// senha inicial studio123 (hash scrypt), 3 clientes, 3 compromissos,
// 1 orçamento aprovado, catálogo com 13 categorias e 13 modelos de contrato.
// Não inventa credencial: DATABASE_URL deve vir do ambiente (Supabase).
import { seedDatabase } from "../lib/repo";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não configurada. Copie a connection string do Supabase (Settings → Database → Connection string, URI, porta 5432) e rode: DATABASE_URL=\"postgres://...\" npm run db:seed");
    process.exit(1);
  }
  const r = await seedDatabase();
  console.log(r.seeded ? "Seed inserido no Postgres." : "Banco já tinha dados — seed não duplicado (só garantidos os checks/passos de publicação).");
  console.log(r);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
