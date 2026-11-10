"use client";
import { useState } from "react";
import type { Overview } from "@/lib/types";
import { fmtMoney, CATEGORY_LABELS, PRODUCTION_STAGES, PRODUCTION_STAGE_LABELS, ROLE_LABELS, ROLE_PERMISSIONS, PERMISSION_MODULES, PERMISSION_ACTIONS } from "@/lib/constants";

export async function post(path: string, body: any) {
  const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
}
const br = (v: number) => (v / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

export function Planner({ d, reload, actor }: { d: Overview; reload: () => void; actor: string }) {
  const [view, setView] = useState("mensal");
  const [form, setForm] = useState({ title: "", clientName: "", date: new Date().toISOString().slice(0, 10), startTime: "09:00", serviceType: "ensaio", location: "" });
  const conflicts = d.appointments.filter((a, i, arr) => arr.some((b, j) => i !== j && a.date === b.date && a.startTime === b.startTime));
  const sorted = [...d.appointments].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const byDay = view === "diario" ? sorted.filter(a => a.date === form.date) : sorted;
  return (<div>
    <div className="card"><h2>Planner</h2>
      <p className="muted">Calendário mensal / semanal / diário. O alerta de conflito aparece sem bloquear o salvamento — igual ao original.</p>
      {conflicts.length > 0 && <p><span className="badge red">⚠ Conflito de horário</span> {conflicts.map(c => `${c.title} — ${c.date} ${c.startTime}`).join(" · ")}</p>}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {(["mensal", "semanal", "diario"] as const).map(v => <button key={v} className={view === v ? "" : "ghost"} onClick={() => setView(v)}>{v}</button>)}
      </div>
      <table><thead><tr><th>Data</th><th>Hora</th><th>Compromisso</th><th>Cliente</th><th>Local</th><th>Status</th><th></th></tr></thead>
        <tbody>{byDay.map(a => <tr key={a.id}><td>{a.date}</td><td>{a.startTime}</td><td>{a.title}</td><td>{a.clientName}</td><td>{a.location}</td><td>{a.status}{a.origin === "google" ? " · Google" : ""}</td><td><button className="ghost" onClick={async () => { await post("/api/planner", { action: "delete-appointment", id: a.id }); reload(); }}>Excluir</button></td></tr>)}</tbody></table>
      {byDay.length === 0 && <p className="muted">Nenhum compromisso neste período.</p>}
    </div>
    <div className="card"><h3>Novo compromisso</h3>
      <div className="grid cols2">
        <input placeholder="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Cliente" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} />
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
        <select value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value })}>{Object.keys(CATEGORY_LABELS).map(k => <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>)}</select>
        <input placeholder="Local" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
      </div>
      <p style={{ marginTop: 10 }}><button onClick={async () => { if (!form.title || !form.date) return alert("Informe título e data."); await post("/api/planner", { action: "create-appointment", ...form }); setForm({ ...form, title: "", clientName: "" }); reload(); }}>Salvar compromisso</button></p>
      <h3>Tarefas</h3>
      {d.tasks.map(t => <p key={t.id}><input type="checkbox" checked={t.done} onChange={async () => { await post("/api/planner", { action: "toggle-task", id: t.id }); reload(); }} /> {t.title} <span className="muted">— {t.assignee} · {t.priority}{t.dueDate ? ` · até ${t.dueDate}` : ""}</span></p>)}
    </div>
  </div>);
}

export function Clients({ d, reload }: { d: Overview; reload: () => void }) {
  const [tab, setTab] = useState("clientes");
  const [client, setClient] = useState({ name: "", phone: "", email: "" });
  const [svc, setSvc] = useState({ name: "", category: "casamento", price: "" });
  const [budget, setBudget] = useState({ clientId: "", serviceId: "", discount: "0", eventDate: "", startTime: "09:00" });
  const [selected, setSelected] = useState<number | null>(null);
  const sel = d.clients.find(c => c.id === selected);
  const selBudgets = d.budgets.filter(b => b.clientId === selected);
  const selAppts = d.appointments.filter(a => a.clientId === selected);
  const selInst = d.installments.filter(i => i.clientId === selected);
  return (<div>
    <nav className="tabs">{["clientes", "servicos", "orcamentos"].map(t => <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t === "clientes" ? "Clientes" : t === "servicos" ? "Serviços (catálogo)" : "Orçamentos"}</button>)}</nav>
    {tab === "clientes" && <div className="card"><h2>Clientes</h2>
      <table><thead><tr><th>Nome</th><th>Telefone / WhatsApp</th><th>E-mail</th><th>Origem</th><th></th></tr></thead>
        <tbody>{d.clients.map(c => <tr key={c.id}><td>{c.name}</td><td>{c.phone}</td><td>{c.email}</td><td>{c.origin}</td><td><button className="ghost" onClick={() => setSelected(c.id)}>Ficha única</button> <button className="ghost" onClick={async () => { if (confirm(`Excluir ${c.name}?`)) { await post("/api/clients", { action: "delete-client", id: c.id }); reload(); } }}>Excluir</button></td></tr>)}</tbody></table>
      <h3>Novo cliente</h3>
      <div className="grid cols2"><input placeholder="Nome *" value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} /><input placeholder="Telefone / WhatsApp" value={client.phone} onChange={e => setClient({ ...client, phone: e.target.value })} /><input placeholder="E-mail" value={client.email} onChange={e => setClient({ ...client, email: e.target.value })} /></div>
      <p style={{ marginTop: 10 }}><button onClick={async () => { if (!client.name) return alert("Informe o nome."); const r = await post("/api/clients", { action: "create-client", ...client }); if (r.duplicateWarning) alert(r.duplicateWarning); setClient({ name: "", phone: "", email: "" }); reload(); }}>Salvar cliente</button></p>
      {sel && <div className="card"><h3>Ficha única — {sel.name} (8 abas no original: dados, orçamentos, agendamentos, financeiro, conversas, arquivos, contratos, documentos)</h3>
        <p><b>Telefone:</b> {sel.phone} · <b>E-mail:</b> {sel.email || "—"} · <b>Origem:</b> {sel.origin || "—"}</p>
        <p><b>Orçamentos:</b> {selBudgets.map(b => `#${b.id} ${b.status} — ${fmtMoney(b.total)}`).join(" · ") || "nenhum"}</p>
        <p><b>Agendamentos:</b> {selAppts.map(a => `${a.title} (${a.date})`).join(" · ") || "nenhum"}</p>
        <p><b>Parcelas:</b> {selInst.map(i => `${i.title} — ${fmtMoney(i.amount)} (pago ${fmtMoney(i.paidAmount)})`).join(" · ") || "nenhuma"}</p>
        <p><button className="ghost" onClick={() => setSelected(null)}>Fechar ficha</button></p></div>}
    </div>}
    {tab === "servicos" && <div className="card"><h2>Catálogo de serviços — 13 categorias</h2>
      <p className="muted">{Object.values(CATEGORY_LABELS).join(" · ")}</p>
      <table><thead><tr><th>Serviço</th><th>Categoria</th><th>Preço</th><th>Duração</th><th></th></tr></thead>
        <tbody>{d.services.map(sv => <tr key={sv.id}><td>{sv.name}</td><td>{CATEGORY_LABELS[sv.category] || sv.category}</td><td>{fmtMoney(sv.price)}</td><td>{sv.durationMin} min</td><td><button className="ghost" onClick={async () => { await post("/api/clients", { action: "delete-service", id: sv.id }); reload(); }}>Excluir</button></td></tr>)}</tbody></table>
      <h3>Novo serviço</h3>
      <div className="grid cols2"><input placeholder="Nome" value={svc.name} onChange={e => setSvc({ ...svc, name: e.target.value })} />
        <select value={svc.category} onChange={e => setSvc({ ...svc, category: e.target.value })}>{Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <input placeholder="Preço (R$)" inputMode="decimal" value={svc.price} onChange={e => setSvc({ ...svc, price: e.target.value })} /></div>
      <p style={{ marginTop: 10 }}><button onClick={async () => { if (!svc.name) return alert("Informe o nome."); await post("/api/clients", { action: "create-service", ...svc }); setSvc({ name: "", category: "casamento", price: "" }); reload(); }}>Salvar serviço</button></p>
    </div>}
    {tab === "orcamentos" && <div className="card"><h2>Orçamentos</h2>
      <table><thead><tr><th>#</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody>{d.budgets.map(b => <tr key={b.id}><td>{b.id}</td><td>{d.clients.find(c => c.id === b.clientId)?.name}</td><td>{b.items.map(i => `${i.serviceName} (${i.quantity}x)`).join(", ")}</td><td>{fmtMoney(b.total)}</td><td>{b.status}</td><td>{b.status !== "aprovado" && <button onClick={async () => { await post("/api/clients", { action: "set-budget-status", id: b.id, status: "aprovado", eventDate: budget.eventDate || undefined, startTime: budget.startTime }); reload(); }}>Aprovar → gera agendamento, parcelas e Kanban</button>} <button className="ghost" onClick={async () => { await post("/api/clients", { action: "delete-budget", id: b.id }); reload(); }}>Excluir</button></td></tr>)}</tbody></table>
      <h3>Novo orçamento</h3>
      <div className="grid cols2">
        <select value={budget.clientId} onChange={e => setBudget({ ...budget, clientId: e.target.value })}><option value="">Cliente…</option>{d.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={budget.serviceId} onChange={e => setBudget({ ...budget, serviceId: e.target.value })}><option value="">Serviço…</option>{d.services.map(sv => <option key={sv.id} value={sv.id}>{sv.name} — {fmtMoney(sv.price)}</option>)}</select>
        <input placeholder="Desconto (R$)" inputMode="decimal" value={budget.discount} onChange={e => setBudget({ ...budget, discount: e.target.value })} />
        <input type="date" value={budget.eventDate} onChange={e => setBudget({ ...budget, eventDate: e.target.value })} />
      </div>
      <p style={{ marginTop: 10 }}><button onClick={async () => { const sv = d.services.find(x => x.id === Number(budget.serviceId)); if (!budget.clientId || !sv) return alert("Escolha cliente e serviço."); await post("/api/clients", { action: "create-budget", clientId: Number(budget.clientId), discount: Number(budget.discount || 0), items: [{ serviceId: sv.id, serviceName: sv.name, unitPrice: sv.price / 100, quantity: 1 }] }); reload(); }}>Criar orçamento (rascunho)</button></p>
      <p className="muted">Ao aprovar, o sistema gera o agendamento no Planner, as parcelas no Financeiro e o cartão no Kanban — como na Fase 3.</p>
    </div>}
  </div>);
}

export function Finance({ d, reload, actor }: { d: Overview; reload: () => void; actor: string }) {
  const [pay, setPay] = useState({ installmentId: "", amount: "", method: "pix" });
  const recebido = d.installments.filter(i => !i.cancelled).reduce((a, i) => a + i.paidAmount, 0);
  const aReceber = d.installments.filter(i => !i.cancelled).reduce((a, i) => a + (i.amount - i.paidAmount), 0);
  const pago = d.expenses.filter(e => !e.cancelled).reduce((a, e) => a + e.paidAmount, 0);
  const aPagar = d.expenses.filter(e => !e.cancelled).reduce((a, e) => a + (e.amount - e.paidAmount), 0);
  const [exp, setExp] = useState({ description: "", category: "outros", amount: "", dueDate: new Date().toISOString().slice(0, 10) });
  return (<div>
    <div className="grid cols3">
      <div className="card"><b>Recebido</b><h2>{fmtMoney(recebido)}</h2></div>
      <div className="card"><b>A receber</b><h2>{fmtMoney(aReceber)}</h2></div>
      <div className="card"><b>A pagar</b><h2>{fmtMoney(aPagar)}</h2><p className="muted">Pago: {fmtMoney(pago)} · Saldo: {fmtMoney(recebido - pago)}</p></div>
    </div>
    <div className="card"><h2>Contas a receber</h2>
      <table><thead><tr><th>Parcela</th><th>Cliente</th><th>Vencimento</th><th>Valor</th><th>Pago</th><th>Status</th></tr></thead>
        <tbody>{d.installments.map(i => <tr key={i.id}><td>{i.title}</td><td>{i.clientName}</td><td>{i.dueDate}</td><td>{fmtMoney(i.amount)}</td><td>{fmtMoney(i.paidAmount)}</td><td>{i.cancelled ? "cancelada" : i.paidAmount >= i.amount ? "recebida" : i.paidAmount > 0 ? "parcial" : i.dueDate < new Date().toISOString().slice(0, 10) ? "vencida" : "a vencer"}</td></tr>)}</tbody></table>
      <h3>Baixa manual (sem baixa automática)</h3>
      <div className="grid cols2">
        <select value={pay.installmentId} onChange={e => setPay({ ...pay, installmentId: e.target.value })}><option value="">Parcela…</option>{d.installments.filter(i => !i.cancelled && i.paidAmount < i.amount).map(i => <option key={i.id} value={i.id}>{i.title} — falta {fmtMoney(i.amount - i.paidAmount)}</option>)}</select>
        <input placeholder="Valor (R$)" inputMode="decimal" value={pay.amount} onChange={e => setPay({ ...pay, amount: e.target.value })} />
        <select value={pay.method} onChange={e => setPay({ ...pay, method: e.target.value })}><option value="pix">PIX</option><option value="dinheiro">Dinheiro</option><option value="cartao-credito">Cartão de crédito</option><option value="cartao-debito">Cartão de débito</option><option value="transferencia">Transferência</option><option value="boleto">Boleto</option></select>
      </div>
      <p style={{ marginTop: 10 }}><button onClick={async () => { if (!pay.installmentId || !pay.amount) return alert("Escolha a parcela e o valor."); await post("/api/finance", { action: "register-payment", installmentId: Number(pay.installmentId), amount: Number(pay.amount), method: pay.method, actor }); setPay({ installmentId: "", amount: "", method: "pix" }); reload(); }}>Registrar baixa</button></p>
      <p className="muted">Mercado Pago / Asaas: Preparado — aguardando escolha e credenciais. Nenhuma cobrança automática está ativa.</p>
    </div>
    <div className="card"><h2>Contas a pagar</h2>
      <table><thead><tr><th>Despesa</th><th>Categoria</th><th>Vencimento</th><th>Valor</th><th>Pago</th></tr></thead>
        <tbody>{d.expenses.map(e => <tr key={e.id}><td>{e.description}</td><td>{e.category}</td><td>{e.dueDate}</td><td>{fmtMoney(e.amount)}</td><td>{fmtMoney(e.paidAmount)}</td></tr>)}</tbody></table>
      <h3>Nova despesa</h3>
      <div className="grid cols2"><input placeholder="Descrição" value={exp.description} onChange={e => setExp({ ...exp, description: e.target.value })} /><input placeholder="Valor (R$)" inputMode="decimal" value={exp.amount} onChange={e => setExp({ ...exp, amount: e.target.value })} /><input type="date" value={exp.dueDate} onChange={e => setExp({ ...exp, dueDate: e.target.value })} /></div>
      <p style={{ marginTop: 10 }}><button onClick={async () => { if (!exp.description || !exp.amount) return alert("Informe descrição e valor."); await post("/api/finance", { action: "create-expense", ...exp, amount: Number(exp.amount) }); setExp({ description: "", category: "outros", amount: "", dueDate: exp.dueDate }); reload(); }}>Salvar despesa</button></p>
    </div>
    <div className="card"><h2>Balanço por tipo de serviço — os 13 tipos, mesmo zerados</h2>
      <table><thead><tr><th>Tipo</th><th>Contratado</th><th>Recebido</th><th>Pendente</th><th>Trabalhos</th></tr></thead>
        <tbody>{Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
          const svcIds = d.services.filter(sv => sv.category === cat).map(sv => sv.id);
          const buds = d.budgets.filter(b => b.status === "aprovado" && b.items.some(i => i.serviceId && svcIds.includes(i.serviceId)));
          const contratado = buds.reduce((a, b) => a + b.total, 0);
          const inst = d.installments.filter(i => buds.some(b => b.id === i.budgetId));
          const recebidoCat = inst.reduce((a, i) => a + i.paidAmount, 0);
          return <tr key={cat}><td>{label}</td><td>{fmtMoney(contratado)}</td><td>{fmtMoney(recebidoCat)}</td><td>{fmtMoney(inst.reduce((a, i) => a + (i.amount - i.paidAmount), 0))}</td><td>{buds.length}</td></tr>;
        })}</tbody></table>
      <h3>Fluxo / histórico permanente</h3>
      {d.financeHistory.map(h => <p key={h.id} className="muted">{h.date || ""} · {h.description} · {h.amount != null ? fmtMoney(h.amount) : ""} · {h.actor}</p>)}
    </div>
  </div>);
}

export function Team({ d, reload }: { d: Overview; reload: () => void }) {
  return (<div>
    <div className="card"><h2>Funcionários — 4 perfis</h2>
      <table><thead><tr><th>Nome</th><th>Perfil</th><th>Ativo</th><th>Trocar senha?</th><th></th></tr></thead>
        <tbody>{d.employees.map(e => <tr key={e.id}><td>{e.name}</td><td>{ROLE_LABELS[e.role]}</td><td>{e.active ? "Sim" : "Não"}</td><td>{e.mustChangePassword ? "Sim — senha inicial" : "Não"}</td><td><button className="ghost" onClick={async () => { await post("/api/team", { action: "set-active", id: e.id, active: !e.active }); reload(); }}>{e.active ? "Desativar (preserva histórico)" : "Reativar"}</button></td></tr>)}</tbody></table>
      <h3>Permissões por perfil (Ver / Criar / Editar / Excluir)</h3>
      {Object.entries(ROLE_PERMISSIONS).map(([role, mods]) => <p key={role}><b>{ROLE_LABELS[role]}:</b> {PERMISSION_MODULES.map(m => `${m}: ${PERMISSION_ACTIONS.filter(a => mods[m]?.[a]).join(", ") || "—"}`).join(" · ")}</p>)}
      <h3>Tarefas</h3>
      {d.tasks.map(t => <p key={t.id}>{t.done ? "✓" : "○"} {t.title} — {t.assignee} · {t.priority}</p>)}
    </div>
    <div className="card"><h2>Produção — Kanban (11 etapas)</h2>
      <p><button onClick={async () => { await post("/api/team", { action: "sync-cards" }); reload(); }}>Sincronizar cartões com compromissos reais</button></p>
      <div className="kanban">{PRODUCTION_STAGES.map(st => <div key={st} className="kanban-col"><b>{PRODUCTION_STAGE_LABELS[st]}</b>
        {d.productionCards.filter(c => c.stage === st).map(c => <div key={c.id} className="kanban-card"><b>{c.title}</b><p className="muted">{c.serviceLabel} · {c.eventDate || ""}</p>
          <select value={c.stage} onChange={async e => { await post("/api/team", { action: "move-card", id: c.id, stage: e.target.value }); reload(); }}>{PRODUCTION_STAGES.map(s2 => <option key={s2} value={s2}>{PRODUCTION_STAGE_LABELS[s2]}</option>)}</select></div>)}
      </div>)}</div>
      <p className="muted">Os cartões só entram de orçamentos/agendamentos reais e só andam quando alguém move — nenhum avanço automático.</p>
    </div>
  </div>);
}

export function Contracts({ d, reload, actor }: { d: Overview; reload: () => void; actor: string }) {
  const [form, setForm] = useState({ clientId: "", templateId: "", serviceLabel: "", eventDate: "", location: "", amount: "" });
  return (<div>
    <div className="card"><h2>Contratos</h2>
      <table><thead><tr><th>Título</th><th>Cliente</th><th>Status</th><th>Valor</th><th>Versão</th><th></th></tr></thead>
        <tbody>{d.contracts.map(c => <tr key={c.id}><td>{c.title}</td><td>{d.clients.find(x => x.id === c.clientId)?.name}</td><td>{c.status}</td><td>{c.amount != null ? fmtMoney(c.amount) : "—"}</td><td>v{c.currentVersion}</td><td>{c.status !== "assinado" && <button onClick={async () => { await post("/api/contracts", { action: "set-status", id: c.id, status: "assinado" }); reload(); }}>Marcar assinado → Kanban</button>}</td></tr>)}</tbody></table>
      <h3>Gerar contrato (a partir de cliente + modelo)</h3>
      <div className="grid cols2">
        <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}><option value="">Cliente…</option>{d.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={form.templateId} onChange={e => setForm({ ...form, templateId: e.target.value })}><option value="">Modelo…</option>{d.templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select>
        <input placeholder="Serviço" value={form.serviceLabel} onChange={e => setForm({ ...form, serviceLabel: e.target.value })} />
        <input type="date" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} />
        <input placeholder="Local" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
        <input placeholder="Valor (R$)" inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
      </div>
      <p style={{ marginTop: 10 }}><button onClick={async () => { if (!form.clientId || !form.templateId) return alert("Escolha cliente e modelo."); await post("/api/contracts", { action: "create-contract", clientId: Number(form.clientId), templateId: Number(form.templateId), serviceLabel: form.serviceLabel, eventDate: form.eventDate, location: form.location, amount: Number(form.amount || 0), actor }); reload(); }}>Gerar contrato</button></p>
      <h3>Modelos (13 — um por tipo de serviço)</h3>
      {d.templates.map(t => <p key={t.id}><b>{t.title}</b> <span className="muted">— {t.body.slice(0, 120)}…</span></p>)}
      <h3>Versões (histórico numerado, nunca apagado)</h3>
      {d.contractVersions.map(v => <p key={v.id} className="muted">Contrato #{v.contractId} · v{v.version} · {v.editedBy || "—"} · {v.title}</p>)}
      <h3>Documentos</h3>
      {d.documents.map(doc => <p key={doc.id}>{doc.name} — {doc.kind} · {doc.date}</p>)}
      <p className="muted">Assinatura eletrônica e Google Drive: Preparado — aguardando integração externa.</p>
    </div>
    <div className="card"><h2>Relatórios (só dados reais)</h2>
      <p>Faturamento contratado: <b>{fmtMoney(d.budgets.filter(b => b.status === "aprovado").reduce((a, b) => a + b.total, 0))}</b> · Recebido: <b>{fmtMoney(d.installments.reduce((a, i) => a + i.paidAmount, 0))}</b> · Clientes: <b>{d.clients.length}</b> · Compromissos: <b>{d.appointments.length}</b></p>
      <p>Serviços mais contratados: {d.services.map(sv => `${sv.name} (${d.budgets.filter(b => b.items.some(i => i.serviceId === sv.id)).length})`).join(" · ")}</p>
      <p>Produção por etapa: {PRODUCTION_STAGES.map(st => `${PRODUCTION_STAGE_LABELS[st]}: ${d.productionCards.filter(c => c.stage === st).length}`).join(" · ")}</p>
      <p><button className="ghost" onClick={() => { const rows = [["cliente", "orcamento", "total"], ...d.budgets.map(b => [d.clients.find(c => c.id === b.clientId)?.name || "", String(b.id), br(b.total)])]; const csv = rows.map(r => r.join(";")).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "relatorio-studio-manager.csv"; a.click(); }}>Exportar CSV</button></p>
    </div>
  </div>);
}

export function WhatsApp({ d, reload }: { d: Overview; reload: () => void }) {
  const [msg, setMsg] = useState({ phone: "", contactName: "", body: "" });
  return (<div>
    <div className="card"><h2>WhatsApp Business</h2>
      <p><span className="badge red">Não conectado</span> <span className="muted">— a integração real exige conta WhatsApp Business Cloud API (Meta), número, token e webhook. Preencher os dados abaixo não marca como Conectado.</span></p>
      {d.whatsappConfig.phoneNumber && <p><span className="badge gold">Dados informados — aguardando validação</span></p>}
      <h3>Registrar mensagem recebida (manual)</h3>
      <div className="grid cols2"><input placeholder="Telefone" value={msg.phone} onChange={e => setMsg({ ...msg, phone: e.target.value })} /><input placeholder="Nome do contato" value={msg.contactName} onChange={e => setMsg({ ...msg, contactName: e.target.value })} /><input placeholder="Mensagem do cliente" value={msg.body} onChange={e => setMsg({ ...msg, body: e.target.value })} /></div>
      <p style={{ marginTop: 10 }}><button onClick={async () => { if (!msg.phone || !msg.body) return alert("Informe telefone e mensagem."); await post("/api/whatsapp", { action: "register-message", ...msg }); setMsg({ phone: "", contactName: "", body: "" }); reload(); }}>Registrar e ler solicitação</button></p>
      <h3>Solicitações (leitura inteligente — aprovação sempre humana)</h3>
      {d.waSuggestions.map(sug => <p key={sug.id}>{sug.title} · {sug.intent || "não identificado"} · {sug.date || "data não identificada"} · <b>{sug.status}</b> {sug.status === "pendente" && <><button onClick={async () => { await post("/api/whatsapp", { action: "approve-suggestion", id: sug.id }); reload(); }}>Aprovar → pré-agendamento</button> <button className="ghost" onClick={async () => { await post("/api/whatsapp", { action: "reject-suggestion", id: sug.id }); reload(); }}>Recusar</button></>}</p>)}
      <h3>Conversas</h3>
      {d.waConversations.map(c => <p key={c.id}>{c.contactName || c.phone} — {c.phone} · {c.status}</p>)}
      {d.waMessages.map(m => <p key={m.id} className="muted">[{m.direction}] {m.body}</p>)}
    </div>
  </div>);
}

export function Release({ d, reload, actor }: { d: Overview; reload: () => void; actor: string }) {
  return (<div>
    <div className="card"><h2>Publicação — Testes</h2>
      <p><button onClick={async () => { await post("/api/release", { action: "run-automatic-checks", actor }); reload(); }}>Rodar verificações automáticas (6)</button> <button className="ghost" onClick={async () => { const r = await post("/api/release", { action: "run-simultaneous-test", actor }); alert(r.summary); reload(); }}>Teste simultâneo (4 perfis)</button></p>
      <table><thead><tr><th>Item</th><th>Tipo</th><th>Status</th><th>Resultado</th><th></th></tr></thead>
        <tbody>{d.releaseChecks.map(c => <tr key={c.key}><td>{c.title}</td><td>{c.kind}</td><td>{c.status}</td><td>{c.result || c.note || "—"}</td><td>{c.kind === "manual" && <button className="ghost" onClick={async () => { await post("/api/release", { action: "set-check", key: c.key, status: c.status === "aprovado" ? "pendente" : "aprovado", actor }); reload(); }}>{c.status === "aprovado" ? "Desmarcar" : "Confirmar"}</button>}</td></tr>)}</tbody></table>
      <p className="muted">Total: {d.releaseChecks.length} itens (6 automáticos + 11 manuais). Os testes nunca apagam dados reais.</p>
    </div>
    <div className="card"><h2>Publicação — passos</h2>
      {d.publicationSteps.map(p => <p key={p.key}><b>{p.title}</b> — {p.state} <span className="muted">({p.scope === "externo" ? "depende de contratação externa" : "dentro do app"}) — {p.description}</span></p>)}
      <p className="muted">Domínio e hospedagem ainda não foram contratados: marque cada passo quando concluir fora do app.</p>
    </div>
    <div className="card"><h2>Senhas e acesso</h2>
      <p className="muted">As senhas ficam guardadas somente como hash com salt (scrypt). Nunca são exibidas. A senha inicial dos 4 perfis é <b>studio123</b> — troque no primeiro acesso (ver README).</p>
      {d.employees.map(e => <p key={e.id}>{e.name} ({ROLE_LABELS[e.role]}) — {e.mustChangePassword ? "senha inicial a trocar" : "senha definida"} <button className="ghost" onClick={async () => { const np = prompt(`Nova senha inicial para ${e.name} (mín. 6 caracteres):`); if (np) { await post("/api/auth", { action: "set-password", employeeId: e.id, newPassword: np, setBy: actor }); reload(); } }}>Definir senha inicial</button></p>)}
    </div>
    <div className="card"><h2>Manual (resumo)</h2>
      <p>1) Entre com seu perfil e troque a senha. 2) Planner: crie e confira conflitos. 3) Clientes: cadastre, monte o orçamento e aprove — vira agendamento, parcelas e Kanban. 4) Financeiro: dê baixa manual em cada parcela. 5) WhatsApp: registre a mensagem e aprove o pré-agendamento. 6) Produção: mova o cartão no Kanban. 7) Contratos: gere do modelo, edite (nova versão) e marque assinado. 8) Relatórios: confira faturamento e balanço por serviço.</p>
    </div>
  </div>);
}
