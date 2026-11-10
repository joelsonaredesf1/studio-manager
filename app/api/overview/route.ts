import { NextResponse } from "next/server";
import { loadOverview, isDb } from "@/lib/repo";
import { dbConfigured } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const store = await loadOverview();
    const safe = { ...store, employees: store.employees.map(({ passwordHash, ...e }) => e) };
    return NextResponse.json({
      ...safe,
      dbConfigured: dbConfigured(),
      mode: isDb() ? "postgres" : "memoria",
      demoWarning: isDb() ? null : "Modo demonstração: sem DATABASE_URL os dados vivem só em memória e não persistem. Configure o Supabase (ver README).",
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e), dbConfigured: dbConfigured(), mode: "postgres" }, { status: 503 });
  }
}
