import { NextResponse } from "next/server";
import { verifyPassword, hashPassword } from "@/lib/store";
import { loadOverview, saveOverview } from "@/lib/repo";
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const store = await loadOverview();
  if (body.action === "login") {
    const emp = store.employees.find(e => e.name.toLowerCase() === String(body.name || "").toLowerCase() && e.active);
    if (!emp || !emp.passwordHash || !verifyPassword(String(body.password || ""), emp.passwordHash))
      return NextResponse.json({ ok: false, error: "Nome ou senha inválidos." }, { status: 401 });
    const { passwordHash, ...safe } = emp;
    return NextResponse.json({ ok: true, employee: safe });
  }
  if (body.action === "change-password") {
    const emp = store.employees.find(e => e.id === Number(body.employeeId));
    if (!emp) return NextResponse.json({ ok: false, error: "Funcionário não encontrado." }, { status: 404 });
    if (!verifyPassword(String(body.currentPassword || ""), emp.passwordHash))
      return NextResponse.json({ ok: false, error: "Senha atual incorreta." }, { status: 400 });
    if (String(body.newPassword || "").length < 6) return NextResponse.json({ ok: false, error: "A nova senha precisa ter ao menos 6 caracteres." }, { status: 400 });
    emp.passwordHash = hashPassword(String(body.newPassword)); emp.mustChangePassword = false;
    await saveOverview(store);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "set-password") {
    const emp = store.employees.find(e => e.id === Number(body.employeeId));
    if (!emp) return NextResponse.json({ ok: false, error: "Funcionário não encontrado." }, { status: 404 });
    if (String(body.newPassword || "").length < 6) return NextResponse.json({ ok: false, error: "A nova senha precisa ter ao menos 6 caracteres." }, { status: 400 });
    emp.passwordHash = hashPassword(String(body.newPassword)); emp.mustChangePassword = true; emp.passwordSetBy = String(body.setBy || "Administrador");
    await saveOverview(store);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "Ação desconhecida." }, { status: 400 });
}
