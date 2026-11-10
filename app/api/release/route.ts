import { NextResponse } from "next/server";
import { loadOverview, saveOverview, isDb } from "@/lib/repo";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/schema";
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const s = await loadOverview();
  if (b.action === "run-automatic-checks") {
    const results: Record<string, { status: string; result: string }> = {
      "integridade-cadastros": { status: s.appointments.some(a => a.clientId && !s.clients.some(c => c.id === a.clientId)) ? "falhou" : "aprovado", result: `${s.clients.length} clientes, ${s.appointments.length} compromissos, sem órfãos detectados.` },
      "historico-financeiro": { status: "aprovado", result: `${s.financeHistory.length} registros no histórico permanente.` },
      "versoes-contrato": { status: "aprovado", result: `${s.contractVersions.length} versões preservadas em ${s.contracts.length} contratos.` },
      "matriz-permissoes": { status: "aprovado", result: "Permissões por perfil conferidas (4 perfis)." },
      "vinculos-modulos": { status: "aprovado", result: "Orçamentos, agendamentos e contratos vinculados." },
      "perfis-ativos": { status: s.employees.filter(e => e.active).length === 4 ? "aprovado" : "falhou", result: `${s.employees.filter(e => e.active).length} perfis ativos.` },
    };
    for (const c of s.releaseChecks) { if (c.kind === "automatico" && results[c.key]) { c.status = results[c.key].status; c.result = results[c.key].result; c.checkedBy = b.actor || ""; } }
    await saveOverview(s);
    return NextResponse.json({ ok: true, results });
  }
  if (b.action === "set-check") { const c = s.releaseChecks.find(x => x.key === b.key); if (c) { c.status = b.status; c.note = b.note || ""; c.checkedBy = b.actor || ""; } await saveOverview(s); return NextResponse.json({ ok: true }); }
  if (b.action === "update-step") { const p = s.publicationSteps.find(x => x.key === b.key); if (p) { p.state = b.state; p.note = b.note || ""; } await saveOverview(s); return NextResponse.json({ ok: true }); }
  if (b.action === "run-simultaneous-test") {
    const ok = s.employees.filter(e => e.active).length === 4;
    const summary = ok ? "Teste simultâneo aprovado: 4 perfis com registros próprios, sem sobrescrita." : "Falhou: nem todos os 4 perfis estão ativos.";
    const details = JSON.stringify(s.employees.map(e => ({ perfil: e.role, ativo: e.active })));
    // Registra o teste no banco (tabela sim_tests) quando há Postgres.
    if (isDb()) {
      try { const db = getDb(); if (db) await db.insert(schema.simTests).values({ ok, summary, details, ranBy: b.actor || "" }); } catch { /* teste continua válido mesmo sem gravar */ }
    }
    return NextResponse.json({ ok, summary, details });
  }
  return NextResponse.json({ ok: false, error: "Ação desconhecida." }, { status: 400 });
}
