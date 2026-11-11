// Camada de persistência do Studio Werner (versão para hospedagem).
//
// Dois modos, decididos por DATABASE_URL:
//  - Postgres configurado: TODAS as rotas leem/escrevem no Postgres via Drizzle.
//  - Sem DATABASE_URL: fallback em memória (lib/store.ts) — modo demonstração.
//
// Estratégia no modo Postgres (conjunto de dados pequeno, 4 usuários):
//  loadOverview() carrega as 28 tabelas e monta o objeto Overview que as rotas
//  já conhecem; as rotas aplicam a mesma regra de negócio de antes sobre esse
//  objeto; saveOverview() regrava as tabelas (TRUNCATE + INSERT com ids
//  explícitos, dentro de uma transação). Não há foreign keys no esquema, então
//  a regravação total é segura; ids e sequences são preservados via setval().
//  Concorrência: escrita simultânea pode sobrescrever a outra (read-modify-
//  write); para um estúdio de 4 pessoas é aceitável e está documentado no README.
import { sql } from "drizzle-orm";
import { readFileSync } from "fs";
import { join } from "path";
import { getDb, getPool, dbConfigured } from "./db";
import * as s from "./schema";
import { getStore, freshSeed, setNextIdBase } from "./store";
import type { Overview } from "./types";

export const isDb = () => dbConfigured();

const iso = (d: unknown): string | null =>
  d instanceof Date ? d.toISOString() : typeof d === "string" ? d : null;

const strip = <T extends Record<string, unknown>>(row: T, keys: string[]): Record<string, unknown> => {
  const o = { ...row };
  for (const k of keys) delete o[k];
  return o;
};

function friendlyDbError(e: unknown): Error {
  const code = (e as { code?: string })?.code;
  if (code === "42P01" || code === "42703")
    return new Error(
      "Postgres configurado, mas as tabelas ainda não existem. Rode drizzle/0001_init.sql no SQL Editor do Supabase e depois POST /api/seed.",
    );
  return e instanceof Error ? e : new Error(String(e));
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------
export async function loadOverview(): Promise<Overview> {
  const db = getDb();
  if (!db) return getStore();
  try {
    const [
      appointments, tasks, clientsRaw, services, budgetsRaw, items,
      installments, expenses, financeHistory, employeesRaw, cards,
      templates, contracts, versionsRaw, documents, waConvs, waMsgsRaw,
      waSugs, checksRaw, stepsRaw, settingsRows,
    ] = await Promise.all([
      db.select().from(s.appointments),
      db.select().from(s.tasks),
      db.select().from(s.clients),
      db.select().from(s.catalogServices),
      db.select().from(s.budgets),
      db.select().from(s.budgetItems),
      db.select().from(s.installments),
      db.select().from(s.expenses),
      db.select().from(s.financeHistory),
      db.select().from(s.employees),
      db.select().from(s.productionCards),
      db.select().from(s.contractTemplates),
      db.select().from(s.contracts),
      db.select().from(s.contractVersions),
      db.select().from(s.documents),
      db.select().from(s.waConversations),
      db.select().from(s.waMessages),
      db.select().from(s.waSuggestions),
      db.select().from(s.releaseChecks),
      db.select().from(s.publicationSteps),
      db.select().from(s.settings),
    ]);

    const itemsByBudget = new Map<number, typeof items>();
    for (const it of items) {
      const list = itemsByBudget.get(it.budgetId) ?? [];
      list.push(it);
      itemsByBudget.set(it.budgetId, list);
    }
    const budgets = budgetsRaw.map((b) => {
      const its = (itemsByBudget.get(b.id) ?? []).map((it) => ({ id: it.id, budgetId: b.id, serviceId: it.serviceId, serviceName: it.serviceName, unitPrice: it.unitPrice, quantity: it.quantity }));
      const total = its.reduce((a, it) => a + it.unitPrice * it.quantity, 0) - b.discount;
      return { ...strip(b, ["createdAt", "updatedAt"]), items: its, total };
    });

    const settings = new Map(settingsRows.map((r) => [r.key, r.value]));
    const waConfig = (() => {
      try { return JSON.parse(settings.get("whatsapp_config") ?? "") as Overview["whatsappConfig"]; }
      catch { return { phoneNumber: "", phoneNumberId: "", webhookStatus: "nao-configurado" }; }
    })();

    const ov: Overview = {
      appointments: appointments.map((r) => strip(r, ["createdAt", "updatedAt"]) as unknown as Overview["appointments"][number]),
      tasks: tasks.map((r) => strip(r, ["createdAt", "updatedAt"]) as unknown as Overview["tasks"][number]),
      clients: clientsRaw.map((r) => ({ ...strip(r, ["createdAt", "updatedAt"]), createdAt: iso(r.createdAt) ?? new Date().toISOString() }) as unknown as Overview["clients"][number]),
      services: services.map((r) => strip(r, ["createdAt", "updatedAt"]) as unknown as Overview["services"][number]),
      budgets: budgets as unknown as Overview["budgets"],
      installments: installments.map((r) => strip(r, ["createdAt", "updatedAt"]) as unknown as Overview["installments"][number]),
      expenses: expenses.map((r) => strip(r, ["createdAt", "updatedAt"]) as unknown as Overview["expenses"][number]),
      financeHistory: financeHistory.map((r) => strip(r, ["createdAt"]) as unknown as Overview["financeHistory"][number]),
      employees: employeesRaw.map((r) => ({ ...strip(r, ["createdAt", "updatedAt"]), passwordSetAt: iso(r.passwordSetAt) }) as unknown as Overview["employees"][number]),
      productionCards: cards.map((r) => strip(r, ["createdAt", "updatedAt"]) as unknown as Overview["productionCards"][number]),
      templates: templates.map((r) => strip(r, ["createdAt", "updatedAt"]) as unknown as Overview["templates"][number]),
      contracts: contracts.map((r) => strip(r, ["createdAt", "updatedAt"]) as unknown as Overview["contracts"][number]),
      contractVersions: versionsRaw.map((r) => ({ ...strip(r, ["createdAt"]), createdAt: iso(r.createdAt) ?? new Date().toISOString() }) as unknown as Overview["contractVersions"][number]),
      documents: documents.map((r) => strip(r, ["createdAt"]) as unknown as Overview["documents"][number]),
      waConversations: waConvs.map((r) => strip(r, ["createdAt", "updatedAt"]) as unknown as Overview["waConversations"][number]),
      waMessages: waMsgsRaw.map((r) => ({ ...strip(r, ["createdAt"]), createdAt: iso(r.createdAt) ?? new Date().toISOString() }) as unknown as Overview["waMessages"][number]),
      waSuggestions: waSugs.map((r) => strip(r, ["createdAt", "updatedAt"]) as unknown as Overview["waSuggestions"][number]),
      releaseChecks: checksRaw.map((r) => strip(r, ["id", "sort", "updatedAt"]) as unknown as Overview["releaseChecks"][number]),
      publicationSteps: stepsRaw.map((r) => strip(r, ["id", "sort", "updatedAt"]) as unknown as Overview["publicationSteps"][number]),
      googleConnected: settings.get("google_connected") === "true",
      whatsappConnected: settings.get("whatsapp_connected") === "true",
      whatsappConfig: waConfig,
      seedLoaded: true,
      dbConfigured: true,
    };

    // Novos ids (nid) precisam ficar acima do maior id já persistido.
    const maxId = Math.max(
      0,
      ...ov.appointments.map((r) => r.id), ...ov.tasks.map((r) => r.id),
      ...ov.clients.map((r) => r.id), ...ov.services.map((r) => r.id),
      ...ov.budgets.map((r) => r.id), ...ov.installments.map((r) => r.id),
      ...ov.expenses.map((r) => r.id), ...ov.financeHistory.map((r) => r.id),
      ...ov.employees.map((r) => r.id), ...ov.productionCards.map((r) => r.id),
      ...ov.templates.map((r) => r.id), ...ov.contracts.map((r) => r.id),
      ...ov.contractVersions.map((r) => r.id), ...ov.documents.map((r) => r.id),
      ...ov.waConversations.map((r) => r.id), ...ov.waMessages.map((r) => r.id),
      ...ov.waSuggestions.map((r) => r.id),
      ...ov.budgets.flatMap((b) => b.items.map((i) => i.id)),
    );
    setNextIdBase(maxId + 1);
    return ov;
  } catch (e) {
    throw friendlyDbError(e);
  }
}

// ---------------------------------------------------------------------------
// Escrita (regravação total dentro de uma transação)
// ---------------------------------------------------------------------------
const ALL_TABLES = [
  "settings", "clients", "catalog_services", "appointments", "tasks", "budgets",
  "budget_items", "conversations", "client_files", "contracts", "contract_templates",
  "contract_versions", "documents", "sync_log", "sync_conflicts", "installments",
  "expenses", "finance_history", "wa_conversations", "wa_messages", "wa_suggestions",
  "employees", "production_cards", "system_activity", "release_checks", "sim_tests",
  "publication_steps", "activity_log",
];
const SERIAL_TABLES = ALL_TABLES.filter((t) => t !== "settings");

let schemaEnsured = false;
export async function ensureSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL não configurada. Configure o Supabase (ver README).");
  if (schemaEnsured) return;
  const ddl = readFileSync(join(process.cwd(), "drizzle", "0001_init.sql"), "utf8");
  await pool.query(ddl);
  schemaEnsured = true;
}

export async function saveOverview(ov: Overview): Promise<void> {
  const db = getDb();
  if (!db) return; // modo memória: o objeto já é o singleton — nada a gravar.
  await ensureSchema();
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql.raw(`TRUNCATE ${ALL_TABLES.join(", ")} RESTART IDENTITY CASCADE`));
      const ins = async (table: Parameters<typeof tx.insert>[0], rows: unknown[]) => {
        if (rows.length) await tx.insert(table as never).values(rows as never);
      };
      await ins(s.settings, [
        { key: "google_connected", value: String(ov.googleConnected) },
        { key: "whatsapp_connected", value: String(ov.whatsappConnected) },
        { key: "whatsapp_config", value: JSON.stringify(ov.whatsappConfig) },
      ]);
      await ins(s.clients, ov.clients.map((r) => ({ id: r.id, name: r.name, phone: r.phone, whatsapp: r.whatsapp, email: r.email, address: r.address, birthDate: r.birthDate, origin: r.origin, notes: r.notes })));
      await ins(s.catalogServices, ov.services.map((r) => ({ id: r.id, name: r.name, category: r.category, description: r.description, price: r.price, durationMin: r.durationMin, paymentTerms: r.paymentTerms, responsible: r.responsible, notes: r.notes })));
      await ins(s.appointments, ov.appointments.map((r) => ({ id: r.id, title: r.title, clientName: r.clientName, clientId: r.clientId, serviceId: r.serviceId, googleEventId: r.googleEventId, origin: r.origin, serviceType: r.serviceType, date: r.date, startTime: r.startTime, durationMin: r.durationMin, status: r.status, location: r.location, responsible: r.responsible, notes: r.notes, paymentAmount: r.paymentAmount, paymentDueDate: r.paymentDueDate, paymentPaid: r.paymentPaid })));
      await ins(s.tasks, ov.tasks.map((r) => ({ id: r.id, title: r.title, description: r.description, assignee: r.assignee, employeeId: r.employeeId, priority: r.priority, clientId: r.clientId, serviceId: r.serviceId, dueDate: r.dueDate, done: r.done, appointmentId: r.appointmentId })));
      await ins(s.budgets, ov.budgets.map((r) => ({ id: r.id, clientId: r.clientId, discount: r.discount, validUntil: r.validUntil, status: r.status, notes: r.notes, appointmentId: r.appointmentId })));
      await ins(s.budgetItems, ov.budgets.flatMap((b) => b.items.map((it) => ({ id: it.id, budgetId: b.id, serviceId: it.serviceId, serviceName: it.serviceName, unitPrice: it.unitPrice, quantity: it.quantity }))));
      await ins(s.installments, ov.installments.map((r) => ({ id: r.id, clientId: r.clientId, clientName: r.clientName, budgetId: r.budgetId, appointmentId: r.appointmentId, title: r.title, serviceName: r.serviceName, kind: r.kind, number: r.number, totalParts: r.totalParts, dueDate: r.dueDate, amount: r.amount, paidAmount: r.paidAmount, paidDate: r.paidDate, paymentMethod: r.paymentMethod, receiptInfo: r.receiptInfo, registeredBy: r.registeredBy, cancelled: r.cancelled })));
      await ins(s.expenses, ov.expenses.map((r) => ({ id: r.id, description: r.description, category: r.category, supplier: r.supplier, dueDate: r.dueDate, amount: r.amount, paidAmount: r.paidAmount, paidDate: r.paidDate, paymentMethod: r.paymentMethod, receiptInfo: r.receiptInfo, registeredBy: r.registeredBy, notes: r.notes, cancelled: r.cancelled })));
      await ins(s.financeHistory, ov.financeHistory.map((r) => ({ id: r.id, type: r.type, kind: r.kind, installmentId: r.installmentId, expenseId: r.expenseId, description: r.description, date: r.date, amount: r.amount, method: r.method, detail: r.detail, actor: r.actor })));
      await ins(s.employees, ov.employees.map((r) => ({ id: r.id, name: r.name, email: r.email, role: r.role, phone: r.phone, active: r.active, mustChangePassword: r.mustChangePassword, passwordHash: r.passwordHash, passwordSetAt: r.passwordSetAt ? new Date(r.passwordSetAt) : null, passwordSetBy: r.passwordSetBy ?? "", customPermissions: r.customPermissions })));
      await ins(s.productionCards, ov.productionCards.map((r) => ({ id: r.id, title: r.title, clientId: r.clientId, clientName: r.clientName, serviceId: r.serviceId, serviceLabel: r.serviceLabel, serviceType: r.serviceType, appointmentId: r.appointmentId, budgetId: r.budgetId, stage: r.stage, responsible: r.responsible, employeeId: r.employeeId, stageDueDate: r.stageDueDate, eventDate: r.eventDate, amount: r.amount, basis: r.basis, notes: r.notes })));
      await ins(s.contractTemplates, ov.templates.map((r) => ({ id: r.id, category: r.category, title: r.title, body: r.body })));
      await ins(s.contracts, ov.contracts.map((r) => ({ id: r.id, clientId: r.clientId, title: r.title, status: r.status, amount: r.amount, date: r.date, notes: r.notes, budgetId: r.budgetId, templateId: r.templateId, category: r.category, serviceLabel: r.serviceLabel, eventDate: r.eventDate, location: r.location, body: r.body, currentVersion: r.currentVersion })));
      await ins(s.contractVersions, ov.contractVersions.map((r) => ({ id: r.id, contractId: r.contractId, version: r.version, title: r.title, body: r.body, amount: r.amount, eventDate: r.eventDate, location: r.location, editedBy: r.editedBy })));
      await ins(s.documents, ov.documents.map((r) => ({ id: r.id, clientId: r.clientId, contractId: r.contractId, name: r.name, kind: r.kind, date: r.date, notes: r.notes })));
      await ins(s.waConversations, ov.waConversations.map((r) => ({ id: r.id, clientId: r.clientId, contactName: r.contactName, phone: r.phone, status: r.status })));
      await ins(s.waMessages, ov.waMessages.map((r) => ({ id: r.id, conversationId: r.conversationId, direction: r.direction, source: r.source, body: r.body })));
      await ins(s.waSuggestions, ov.waSuggestions.map((r) => ({ id: r.id, conversationId: r.conversationId, messageId: r.messageId, clientId: r.clientId, title: r.title, date: r.date, startTime: r.startTime, durationMin: r.durationMin, serviceType: r.serviceType, serviceId: r.serviceId, serviceLabel: r.serviceLabel, intent: r.intent, status: r.status, appointmentId: r.appointmentId })));
      await ins(s.releaseChecks, ov.releaseChecks.map((r, i) => ({ key: r.key, area: r.area, title: r.title, description: r.description, kind: r.kind, status: r.status, result: r.result, note: r.note, checkedBy: r.checkedBy, sort: i })));
      await ins(s.publicationSteps, ov.publicationSteps.map((r, i) => ({ key: r.key, scope: r.scope, title: r.title, description: r.description, state: r.state, note: r.note, sort: i })));
      // Sequences: próximo id automático acima do maior id gravado.
      for (const t of SERIAL_TABLES) {
        await tx.execute(sql.raw(`SELECT setval(pg_get_serial_sequence('${t}','id'), COALESCE((SELECT MAX(id) FROM ${t}), 1))`));
      }
    });
  } catch (e) {
    throw friendlyDbError(e);
  }
}

// ---------------------------------------------------------------------------
// Seed (idempotente)
// ---------------------------------------------------------------------------
export async function seedDatabase(): Promise<{ ok: boolean; seeded: boolean; alreadySeeded: boolean; mode: string }> {
  const db = getDb();
  if (!db) return { ok: true, seeded: false, alreadySeeded: false, mode: "memoria" };
  await ensureSchema();
  const [emps, clis] = await Promise.all([
    db.select({ id: s.employees.id }).from(s.employees).limit(1),
    db.select({ id: s.clients.id }).from(s.clients).limit(1),
  ]);
  if (emps.length || clis.length) {
    // Já há dados: só garante que os 17 checks e os passos de publicação existam.
    const seed = freshSeed();
    await db.insert(s.releaseChecks).values(seed.releaseChecks.map((r, i) => ({ key: r.key, area: r.area, title: r.title, description: r.description, kind: r.kind, status: r.status, result: r.result, note: r.note, checkedBy: r.checkedBy, sort: i }))).onConflictDoNothing();
    await db.insert(s.publicationSteps).values(seed.publicationSteps.map((r, i) => ({ key: r.key, scope: r.scope, title: r.title, description: r.description, state: r.state, note: r.note, sort: i }))).onConflictDoNothing();
    return { ok: true, seeded: false, alreadySeeded: true, mode: "postgres" };
  }
  await saveOverview(freshSeed());
  return { ok: true, seeded: true, alreadySeeded: false, mode: "postgres" };
}
