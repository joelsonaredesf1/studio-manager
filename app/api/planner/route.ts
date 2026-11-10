import { NextResponse } from "next/server";
import { nid } from "@/lib/store";
import { loadOverview, saveOverview } from "@/lib/repo";
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const s = await loadOverview();
  if (b.action === "create-appointment") {
    const a = { id: nid(), title: b.title, clientName: b.clientName || "", clientId: b.clientId ?? null, serviceId: b.serviceId ?? null, googleEventId: null, origin: "studio", serviceType: b.serviceType || "ensaio", date: b.date, startTime: b.startTime, durationMin: Number(b.durationMin || 60), status: b.status || "confirmado", location: b.location || "", responsible: b.responsible || "", notes: b.notes || "", paymentAmount: b.paymentAmount ? Math.round(Number(b.paymentAmount) * 100) : null, paymentDueDate: b.paymentDueDate || null, paymentPaid: false };
    s.appointments.push(a); await saveOverview(s); return NextResponse.json({ ok: true, appointment: a });
  }
  if (b.action === "delete-appointment") { s.appointments = s.appointments.filter(x => x.id !== Number(b.id)); await saveOverview(s); return NextResponse.json({ ok: true }); }
  if (b.action === "create-task") {
    const t = { id: nid(), title: b.title, description: b.description || "", assignee: b.assignee || "", employeeId: b.employeeId ?? null, priority: b.priority || "media", clientId: b.clientId ?? null, serviceId: b.serviceId ?? null, dueDate: b.dueDate || null, done: false, appointmentId: b.appointmentId ?? null };
    s.tasks.push(t); await saveOverview(s); return NextResponse.json({ ok: true, task: t });
  }
  if (b.action === "toggle-task") { const t = s.tasks.find(x => x.id === Number(b.id)); if (t) t.done = !t.done; await saveOverview(s); return NextResponse.json({ ok: true }); }
  if (b.action === "delete-task") { s.tasks = s.tasks.filter(x => x.id !== Number(b.id)); await saveOverview(s); return NextResponse.json({ ok: true }); }
  return NextResponse.json({ ok: false, error: "Ação desconhecida." }, { status: 400 });
}
