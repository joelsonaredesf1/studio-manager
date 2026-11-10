import { NextResponse } from "next/server";
import { resetStore } from "@/lib/store";
import { seedDatabase, isDb } from "@/lib/repo";
export async function POST() {
  try {
    if (isDb()) {
      const r = await seedDatabase();
      return NextResponse.json({ ...r, ok: true });
    }
    resetStore();
    return NextResponse.json({ ok: true, mode: "memoria", seeded: true, alreadySeeded: false, note: "Modo demonstração: dados em memória recarregados. Sem DATABASE_URL, nada foi gravado no banco." });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
