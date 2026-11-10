import { NextResponse } from "next/server";
import { nid } from "@/lib/store";
import { loadOverview, saveOverview } from "@/lib/repo";
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const s = await loadOverview();
  if (b.action === "register-payment") {
    const inst = s.installments.find(x => x.id === Number(b.installmentId));
    if (!inst) return NextResponse.json({ ok: false }, { status: 404 });
    const amt = Math.round(Number(b.amount || 0) * 100);
    inst.paidAmount = Math.min(inst.amount, inst.paidAmount + amt); inst.paidDate = b.date || new Date().toISOString().slice(0, 10);
    inst.paymentMethod = b.method || "pix"; inst.receiptInfo = b.receiptInfo || ""; inst.registeredBy = b.actor || "";
    s.financeHistory.push({ id: nid(), type: "baixa", kind: "receita", installmentId: inst.id, expenseId: null, description: inst.title, date: inst.paidDate, amount: amt, method: inst.paymentMethod, detail: "Baixa manual registrada.", actor: b.actor || "" });
    await saveOverview(s);
    return NextResponse.json({ ok: true, installment: inst });
  }
  if (b.action === "cancel-installment") { const i = s.installments.find(x => x.id === Number(b.id)); if (i) { i.cancelled = true; s.financeHistory.push({ id: nid(), type: "cancelamento", kind: "receita", installmentId: i.id, expenseId: null, description: i.title, date: null, amount: null, method: null, detail: "Parcela cancelada (preservada no histórico).", actor: b.actor || "" }); } await saveOverview(s); return NextResponse.json({ ok: true }); }
  if (b.action === "create-expense") {
    const e = { id: nid(), description: b.description, category: b.category || "outros", supplier: b.supplier || "", dueDate: b.dueDate, amount: Math.round(Number(b.amount || 0) * 100), paidAmount: 0, paidDate: null, paymentMethod: null, receiptInfo: "", registeredBy: "", notes: b.notes || "", cancelled: false };
    s.expenses.push(e); await saveOverview(s); return NextResponse.json({ ok: true, expense: e });
  }
  if (b.action === "pay-expense") {
    const e = s.expenses.find(x => x.id === Number(b.id)); if (!e) return NextResponse.json({ ok: false }, { status: 404 });
    const amt = Math.round(Number(b.amount || 0) * 100); e.paidAmount = Math.min(e.amount, e.paidAmount + amt); e.paidDate = b.date || new Date().toISOString().slice(0, 10); e.paymentMethod = b.method || "pix";
    s.financeHistory.push({ id: nid(), type: "baixa", kind: "despesa", installmentId: null, expenseId: e.id, description: e.description, date: e.paidDate, amount: amt, method: e.paymentMethod, detail: "Baixa manual registrada.", actor: b.actor || "" });
    await saveOverview(s);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "set-gateway") { return NextResponse.json({ ok: true, note: "Gateway só 'Preparado — aguardando escolha e credenciais'. Nenhuma cobrança foi ativada." }); }
  return NextResponse.json({ ok: false, error: "Ação desconhecida." }, { status: 400 });
}
