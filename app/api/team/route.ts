import { NextResponse } from "next/server";
import { nid } from "@/lib/store";
import { loadOverview, saveOverview } from "@/lib/repo";
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const s = await loadOverview();
  if (b.action === "create-employee") { const e = { id: nid(), name: b.name, email: b.email || "", role: b.role || "atendimento", phone: b.phone || "", active: true, mustChangePassword: true, passwordHash: "", customPermissions: "" }; s.employees.push(e); await saveOverview(s); return NextResponse.json({ ok: true, employee: { ...e, passwordHash: undefined } }); }
  if (b.action === "set-active") { const e = s.employees.find(x => x.id === Number(b.id)); if (e) e.active = Boolean(b.active); await saveOverview(s); return NextResponse.json({ ok: true }); }
  if (b.action === "update-permissions") { const e = s.employees.find(x => x.id === Number(b.id)); if (e) e.customPermissions = JSON.stringify(b.permissions || {}); await saveOverview(s); return NextResponse.json({ ok: true }); }
  if (b.action === "create-card") { const c = { id: nid(), title: b.title, clientId: b.clientId ?? null, clientName: b.clientName || "", serviceId: b.serviceId ?? null, serviceLabel: b.serviceLabel || "", serviceType: b.serviceType ?? null, appointmentId: b.appointmentId ?? null, budgetId: b.budgetId ?? null, stage: b.stage || "solicitacao-recebida", responsible: b.responsible || "", employeeId: b.employeeId ?? null, stageDueDate: b.stageDueDate || null, eventDate: b.eventDate || null, amount: b.amount ? Math.round(Number(b.amount) * 100) : null, basis: b.basis || "Criado manualmente.", notes: b.notes || "" }; s.productionCards.push(c); await saveOverview(s); return NextResponse.json({ ok: true, card: c }); }
  if (b.action === "move-card") { const c = s.productionCards.find(x => x.id === Number(b.id)); if (c) c.stage = b.stage; await saveOverview(s); return NextResponse.json({ ok: true }); }
  if (b.action === "delete-card") { s.productionCards = s.productionCards.filter(x => x.id !== Number(b.id)); await saveOverview(s); return NextResponse.json({ ok: true }); }
  if (b.action === "sync-cards") {
    // Sincroniza cartões a partir de compromissos reais sem duplicar (regra da Fase 7).
    let created = 0;
    for (const a of s.appointments) { if (!s.productionCards.some(c => c.appointmentId === a.id)) { s.productionCards.push({ id: nid(), title: a.title, clientId: a.clientId, clientName: a.clientName, serviceId: a.serviceId, serviceLabel: "", serviceType: a.serviceType, appointmentId: a.id, budgetId: null, stage: "ensaio-agendado", responsible: a.responsible, employeeId: null, stageDueDate: a.date, eventDate: a.date, amount: a.paymentAmount, basis: "Agendamento confirmado.", notes: "" }); created++; } }
    await saveOverview(s);
    return NextResponse.json({ ok: true, created });
  }
  return NextResponse.json({ ok: false, error: "Ação desconhecida." }, { status: 400 });
}
