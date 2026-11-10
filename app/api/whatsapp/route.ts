import { NextResponse } from "next/server";
import { nid } from "@/lib/store";
import { loadOverview, saveOverview } from "@/lib/repo";
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const s = await loadOverview();
  if (b.action === "register-message") {
    let conv = s.waConversations.find(c => c.phone === b.phone);
    if (!conv) { conv = { id: nid(), clientId: b.clientId ?? null, contactName: b.contactName || "", phone: b.phone, status: "aguardando-atendimento" }; s.waConversations.push(conv); }
    const msg = { id: nid(), conversationId: conv.id, direction: "recebida", source: "manual", body: b.body, createdAt: new Date().toISOString() };
    s.waMessages.push(msg);
    // Leitura inteligente simples: identifica serviço por palavra-chave e data dd/mm
    const lower = b.body.toLowerCase();
    const svc = s.services.find(v => lower.includes(v.name.toLowerCase().split(" ")[0])) || s.services.find(v => lower.includes("gestante") && v.category === "gestante") || null;
    const m = b.body.match(/(\d{1,2})\/(\d{1,2})/);
    const sug = { id: nid(), conversationId: conv.id, messageId: msg.id, clientId: conv.clientId, title: svc ? `${svc.name} — ${conv.contactName || conv.phone}` : `Solicitação — ${conv.contactName || conv.phone}`, date: m ? `2026-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null, startTime: null, durationMin: svc?.durationMin || 60, serviceType: null, serviceId: svc?.id ?? null, serviceLabel: svc?.name || "", intent: lower.includes("orçament") || lower.includes("valor") ? "orcamento" : lower.includes("agend") ? "agendamento" : null, status: "pendente", appointmentId: null };
    s.waSuggestions.push(sug);
    await saveOverview(s);
    return NextResponse.json({ ok: true, conversation: conv, suggestion: sug });
  }
  if (b.action === "reply") { s.waMessages.push({ id: nid(), conversationId: Number(b.conversationId), direction: "resposta", source: "manual", body: b.body, createdAt: new Date().toISOString() }); await saveOverview(s); return NextResponse.json({ ok: true, note: "Resposta registrada manualmente. Nenhuma mensagem real foi enviada pelo WhatsApp." }); }
  if (b.action === "set-status") { const c = s.waConversations.find(x => x.id === Number(b.id)); if (c) c.status = b.status; await saveOverview(s); return NextResponse.json({ ok: true }); }
  if (b.action === "approve-suggestion") {
    const sug = s.waSuggestions.find(x => x.id === Number(b.id)); if (!sug) return NextResponse.json({ ok: false }, { status: 404 });
    sug.status = "aprovada";
    if (sug.date) { const conv = s.waConversations.find(c => c.id === sug.conversationId); const appt = { id: nid(), title: sug.title, clientName: conv?.contactName || "", clientId: sug.clientId, serviceId: sug.serviceId, googleEventId: null, origin: "studio", serviceType: sug.serviceType || "ensaio", date: sug.date, startTime: sug.startTime || "09:00", durationMin: sug.durationMin, status: "pre-agendamento", location: "", responsible: "", notes: "Pré-agendamento aprovado a partir do WhatsApp (aprovação humana).", paymentAmount: null, paymentDueDate: null, paymentPaid: false }; s.appointments.push(appt); sug.appointmentId = appt.id; }
    await saveOverview(s);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "reject-suggestion") { const sug = s.waSuggestions.find(x => x.id === Number(b.id)); if (sug) sug.status = "recusada"; await saveOverview(s); return NextResponse.json({ ok: true }); }
  if (b.action === "update-config") { s.whatsappConfig = { phoneNumber: b.phoneNumber || "", phoneNumberId: b.phoneNumberId || "", webhookStatus: "pendente" }; s.whatsappConnected = false; await saveOverview(s); return NextResponse.json({ ok: true, note: "Dados informados — aguardando validação. Não conectado." }); }
  if (b.action === "validate") { return NextResponse.json({ ok: false, connected: false, note: "A validação real depende da conta WhatsApp Business Cloud API (Meta) e não foi executada. Status: Não conectado." }); }
  return NextResponse.json({ ok: false, error: "Ação desconhecida." }, { status: 400 });
}
