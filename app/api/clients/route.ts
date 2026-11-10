import { NextResponse } from "next/server";
import { nid } from "@/lib/store";
import { loadOverview, saveOverview } from "@/lib/repo";
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const s = await loadOverview();
  if (b.action === "create-client") {
    const dup = s.clients.find(c => (b.phone && c.phone === b.phone) || (b.email && c.email === b.email));
    const c = { id: nid(), name: b.name, phone: b.phone || "", whatsapp: b.whatsapp || b.phone || "", email: b.email || "", address: b.address || "", birthDate: b.birthDate || null, origin: b.origin || "", notes: b.notes || "", createdAt: new Date().toISOString() };
    s.clients.push(c); await saveOverview(s); return NextResponse.json({ ok: true, client: c, duplicateWarning: dup ? `Já existe um cliente com esse telefone/e-mail: ${dup.name}.` : null });
  }
  if (b.action === "delete-client") { s.clients = s.clients.filter(x => x.id !== Number(b.id)); await saveOverview(s); return NextResponse.json({ ok: true }); }
  if (b.action === "create-service") {
    const v = { id: nid(), name: b.name, category: b.category, description: b.description || "", price: Math.round(Number(b.price || 0) * 100), durationMin: Number(b.durationMin || 60), paymentTerms: b.paymentTerms || "", responsible: b.responsible || "", notes: b.notes || "" };
    s.services.push(v); await saveOverview(s); return NextResponse.json({ ok: true, service: v });
  }
  if (b.action === "delete-service") { s.services = s.services.filter(x => x.id !== Number(b.id)); await saveOverview(s); return NextResponse.json({ ok: true }); }
  if (b.action === "create-budget") {
    const items = (b.items || []).map((it: any) => ({ id: nid(), budgetId: 0, serviceId: it.serviceId ?? null, serviceName: it.serviceName, unitPrice: Math.round(Number(it.unitPrice || 0) * 100), quantity: Number(it.quantity || 1) }));
    const total = items.reduce((a: number, it: any) => a + it.unitPrice * it.quantity, 0) - Math.round(Number(b.discount || 0) * 100);
    const bud = { id: nid(), clientId: Number(b.clientId), discount: Math.round(Number(b.discount || 0) * 100), validUntil: b.validUntil || null, status: "rascunho", notes: b.notes || "", appointmentId: null, items: items.map((it: any) => ({ ...it, budgetId: 0 })), total };
    bud.items.forEach((it: any) => { it.budgetId = bud.id; });
    s.budgets.push(bud); await saveOverview(s); return NextResponse.json({ ok: true, budget: bud });
  }
  if (b.action === "set-budget-status") {
    const bud = s.budgets.find(x => x.id === Number(b.id)); if (!bud) return NextResponse.json({ ok: false }, { status: 404 });
    bud.status = b.status;
    if (b.status === "aprovado" && !bud.appointmentId) {
      const client = s.clients.find(c => c.id === bud.clientId);
      const svc = bud.items[0];
      const appt = { id: nid(), title: `${svc?.serviceName || "Serviço"} — ${client?.name || ""}`, clientName: client?.name || "", clientId: bud.clientId, serviceId: svc?.serviceId ?? null, googleEventId: null, origin: "studio", serviceType: "ensaio", date: b.eventDate || new Date().toISOString().slice(0, 10), startTime: b.startTime || "09:00", durationMin: 60, status: "confirmado", location: b.location || "", responsible: "", notes: `Gerado do orçamento #${bud.id}.`, paymentAmount: bud.total, paymentDueDate: null, paymentPaid: false };
      s.appointments.push(appt); bud.appointmentId = appt.id;
      // Parcelas: entrada 40% + restante em 2 (regra simplificada; editar no Financeiro)
      const total = bud.total;
      const parts = [Math.round(total * 0.4), Math.round(total * 0.3), total - Math.round(total * 0.4) - Math.round(total * 0.3)];
      parts.forEach((amt, i) => s.installments.push({ id: nid(), clientId: bud.clientId, clientName: client?.name || "", budgetId: bud.id, appointmentId: appt.id, title: i === 0 ? `Entrada — ${svc?.serviceName || ""}` : `Parcela ${i + 1}/3`, serviceName: svc?.serviceName || "", kind: i === 0 ? "entrada" : "parcela", number: i + 1, totalParts: 3, dueDate: b.eventDate || appt.date, amount: amt, paidAmount: 0, paidDate: null, paymentMethod: null, receiptInfo: "", registeredBy: "", cancelled: false }));
      s.productionCards.push({ id: nid(), title: appt.title, clientId: bud.clientId, clientName: client?.name || "", serviceId: svc?.serviceId ?? null, serviceLabel: svc?.serviceName || "", serviceType: null, appointmentId: appt.id, budgetId: bud.id, stage: "ensaio-agendado", responsible: "", employeeId: null, stageDueDate: appt.date, eventDate: appt.date, amount: total, basis: "Orçamento aprovado.", notes: "" });
    }
    await saveOverview(s);
    return NextResponse.json({ ok: true, budget: bud });
  }
  if (b.action === "delete-budget") { s.budgets = s.budgets.filter(x => x.id !== Number(b.id)); await saveOverview(s); return NextResponse.json({ ok: true }); }
  return NextResponse.json({ ok: false, error: "Ação desconhecida." }, { status: 400 });
}
