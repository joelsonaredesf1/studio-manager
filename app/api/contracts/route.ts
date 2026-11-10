import { NextResponse } from "next/server";
import { nid } from "@/lib/store";
import { loadOverview, saveOverview } from "@/lib/repo";
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const s = await loadOverview();
  if (b.action === "create-contract") {
    const client = s.clients.find(c => c.id === Number(b.clientId)); const tpl = s.templates.find(t => t.id === Number(b.templateId));
    const body = (tpl?.body || "").replaceAll("{{cliente}}", client?.name || "").replaceAll("{{servico}}", b.serviceLabel || "").replaceAll("{{data_evento}}", b.eventDate || "").replaceAll("{{local}}", b.location || "").replaceAll("{{valor}}", b.amount ? `R$ ${(Number(b.amount)).toFixed(2)}` : "");
    const c = { id: nid(), clientId: Number(b.clientId), title: b.title || `Contrato — ${client?.name || ""}`, status: "rascunho", amount: b.amount ? Math.round(Number(b.amount) * 100) : null, date: new Date().toISOString().slice(0, 10), notes: "", budgetId: b.budgetId ?? null, templateId: tpl?.id ?? null, category: tpl?.category ?? null, serviceLabel: b.serviceLabel || "", eventDate: b.eventDate || null, location: b.location || "", body, currentVersion: 1 };
    s.contracts.push(c); s.contractVersions.push({ id: nid(), contractId: c.id, version: 1, title: c.title, body, amount: c.amount, eventDate: c.eventDate, location: c.location, editedBy: b.actor || "", createdAt: new Date().toISOString() });
    await saveOverview(s);
    return NextResponse.json({ ok: true, contract: c });
  }
  if (b.action === "update-content") {
    const c = s.contracts.find(x => x.id === Number(b.id)); if (!c) return NextResponse.json({ ok: false }, { status: 404 });
    c.currentVersion += 1; c.body = b.body; c.title = b.title || c.title; c.amount = b.amount != null ? Math.round(Number(b.amount) * 100) : c.amount;
    s.contractVersions.push({ id: nid(), contractId: c.id, version: c.currentVersion, title: c.title, body: c.body, amount: c.amount, eventDate: c.eventDate, location: c.location, editedBy: b.actor || "", createdAt: new Date().toISOString() });
    await saveOverview(s);
    return NextResponse.json({ ok: true, contract: c });
  }
  if (b.action === "set-status") {
    const c = s.contracts.find(x => x.id === Number(b.id)); if (!c) return NextResponse.json({ ok: false }, { status: 404 });
    c.status = b.status;
    if (b.status === "assinado" && c.budgetId) { const card = s.productionCards.find(x => x.budgetId === c.budgetId); if (card) card.stage = "contrato-assinado"; }
    await saveOverview(s);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "update-template") { const t = s.templates.find(x => x.id === Number(b.id)); if (t) { t.title = b.title || t.title; t.body = b.body || t.body; } await saveOverview(s); return NextResponse.json({ ok: true }); }
  if (b.action === "add-document") { const d = { id: nid(), clientId: Number(b.clientId), contractId: b.contractId ? Number(b.contractId) : null, name: b.name, kind: b.kind || "outro", date: b.date || new Date().toISOString().slice(0, 10), notes: b.notes || "" }; s.documents.push(d); await saveOverview(s); return NextResponse.json({ ok: true, document: d }); }
  if (b.action === "delete-document") { s.documents = s.documents.filter(x => x.id !== Number(b.id)); await saveOverview(s); return NextResponse.json({ ok: true }); }
  return NextResponse.json({ ok: false, error: "Ação desconhecida." }, { status: 400 });
}
