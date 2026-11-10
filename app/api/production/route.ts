import { NextResponse } from "next/server";
import { loadOverview, saveOverview } from "@/lib/repo";
// Atalho: as ações de produção vivem em /api/team (mesma base).
// Esta rota só aceita move-card para compatibilidade com o front.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const s = await loadOverview();
  if (b.action === "move-card") { const c = s.productionCards.find(x => x.id === Number(b.id)); if (c) c.stage = b.stage; await saveOverview(s); return NextResponse.json({ ok: true }); }
  return NextResponse.json({ ok: false, error: "Use /api/team para produção." }, { status: 400 });
}
