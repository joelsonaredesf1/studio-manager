import { NextResponse } from "next/server";
import { loadOverview } from "@/lib/repo";
export const dynamic = "force-dynamic";
export async function GET() {
  const s = await loadOverview();
  const recebido = s.installments.filter(i => !i.cancelled).reduce((a, i) => a + i.paidAmount, 0);
  const contratado = s.budgets.filter(b => b.status === "aprovado").reduce((a, b) => a + b.total, 0);
  const aPagar = s.expenses.filter(e => !e.cancelled).reduce((a, e) => a + (e.amount - e.paidAmount), 0);
  const aReceber = s.installments.filter(i => !i.cancelled).reduce((a, i) => a + (i.amount - i.paidAmount), 0);
  return NextResponse.json({ recebido, contratado, aPagar, aReceber, clientes: s.clients.length, orcamentos: s.budgets.length, compromissos: s.appointments.length });
}
