"use client";
import { useCallback, useEffect, useState } from "react";
import type { Overview } from "@/lib/types";
import { Planner, Clients, Finance, Team, Contracts, WhatsApp, Release, post } from "@/components/Sections";

const TABS = [
  { key: "planner", label: "Planner" }, { key: "clientes", label: "Clientes e Serviços" },
  { key: "financeiro", label: "Financeiro" }, { key: "whatsapp", label: "WhatsApp" },
  { key: "equipe", label: "Funcionários e Produção" }, { key: "contratos", label: "Contratos e Relatórios" },
  { key: "publicacao", label: "Publicação" },
] as const;

export default function Home() {
  const [data, setData] = useState<Overview | null>(null);
  const [tab, setTab] = useState<string>("planner");
  const [user, setUser] = useState<{ id: number; name: string; role: string } | null>(null);
  const [login, setLogin] = useState({ name: "Administrador", password: "" });
  const [loginError, setLoginError] = useState("");
  const [newPw, setNewPw] = useState("");

  const reload = useCallback(async () => {
    const r = await fetch("/api/overview", { cache: "no-store" });
    setData(await r.json());
  }, []);
  useEffect(() => { reload(); }, [reload]);

  async function doLogin() {
    const r = await post("/api/auth", { action: "login", name: login.name, password: login.password });
    if (!r.ok) { setLoginError(r.error || "Falha no login."); return; }
    setUser(r.employee); setLoginError("");
  }

  return (<>
    <header className="top"><h1>STUDIO <span>MANAGER</span></h1><p className="muted" style={{ color: "#ccc", margin: "4px 0 0" }}>Gestão para estúdio de fotografia · versão para hospedagem (Next.js + Supabase)</p></header>
    <main>
      {!user ? (
        <div className="card" style={{ maxWidth: 480 }}>
          <h2>Entrar</h2>
          <p className="muted">Perfis iniciais: Administrador, Gerente, Atendimento e Fotógrafo. Senha inicial de todos: <b>studio123</b> — troque no primeiro acesso em Publicação → Senhas e acesso.</p>
          <p><input placeholder="Nome do perfil" value={login.name} onChange={e => setLogin({ ...login, name: e.target.value })} style={{ width: "100%" }} /></p>
          <p><input type="password" placeholder="Senha" value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })} onKeyDown={e => e.key === "Enter" && doLogin()} style={{ width: "100%" }} /></p>
          {loginError && <p><span className="badge red">{loginError}</span></p>}
          <p><button onClick={doLogin}>Entrar</button></p>
          {!data && <p className="muted">Carregando dados…</p>}
          {data && <p className="muted">Banco: {data.dbConfigured ? "Postgres configurado (DATABASE_URL)" : "em memória — configure o Supabase para persistir (ver README)"} · Google Agenda: <span className="badge red">Não conectado</span> · WhatsApp: <span className="badge red">Não conectado</span></p>}
        </div>
      ) : data ? (<>
        <p>Logado como <b>{user.name}</b> ({user.role}) <button className="ghost" onClick={() => setUser(null)}>Sair</button>
          {data.dbConfigured ? <span className="badge green">Banco Postgres</span> : <span className="badge gold">Sem banco — dados em memória</span>}
          <span className="badge red">Google Agenda: Não conectado</span></p>
        {user && (data.employees.find(e => e.id === user.id) as any)?.mustChangePassword && (
          <div className="card"><b>Troque sua senha inicial:</b>
            <p><input type="password" placeholder="Nova senha (mín. 6 caracteres)" value={newPw} onChange={e => setNewPw(e.target.value)} /> <button onClick={async () => { const r = await post("/api/auth", { action: "change-password", employeeId: user.id, currentPassword: "studio123", newPassword: newPw }); if (r.ok) { alert("Senha trocada."); reload(); } else alert(r.error); }}>Trocar senha</button></p>
          </div>)}
        <nav className="tabs">{TABS.map(t => <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>{t.label}</button>)}</nav>
        {tab === "planner" && <Planner d={data} reload={reload} actor={user.name} />}
        {tab === "clientes" && <Clients d={data} reload={reload} />}
        {tab === "financeiro" && <Finance d={data} reload={reload} actor={user.name} />}
        {tab === "whatsapp" && <WhatsApp d={data} reload={reload} />}
        {tab === "equipe" && <Team d={data} reload={reload} />}
        {tab === "contratos" && <Contracts d={data} reload={reload} actor={user.name} />}
        {tab === "publicacao" && <Release d={data} reload={reload} actor={user.name} />}
      </>) : <p>Carregando…</p>}
      <footer className="muted"><p>Studio Manager — versão separada para hospedagem externa. O app original do Muse não foi alterado. Google Agenda e WhatsApp aparecem como “Não conectado” até a integração real ser configurada — nada aqui finge integração.</p></footer>
    </main>
  </>);
}
