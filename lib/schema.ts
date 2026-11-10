// Esquema Drizzle para Postgres (Supabase), traduzido de server/src/schema.ts
// (SQLite -> Postgres: integer autoincrement -> serial, timestamp_ms -> timestamp, boolean -> boolean).
import { pgTable, serial, integer, text, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { SERVICE_TYPES, SERVICE_CATEGORIES, BUDGET_STATUSES, CONTRACT_STATUSES, CONVERSATION_CHANNELS, PAYMENT_METHODS, EXPENSE_CATEGORIES, WA_CONVERSATION_STATUSES, WA_INTENTS, WA_SUGGESTION_STATUSES, EMPLOYEE_ROLES, PRODUCTION_STAGES, DOCUMENT_KINDS } from "./constants";

const ts = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const upd = () => timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(), title: text("title").notNull(), clientName: text("client_name").notNull().default(""),
  clientId: integer("client_id"), serviceId: integer("service_id"), googleEventId: text("google_event_id"),
  origin: varchar("origin", { length: 20 }).notNull().default("studio"),
  serviceType: varchar("service_type", { length: 30 }).notNull(), date: varchar("date", { length: 10 }).notNull(),
  startTime: varchar("start_time", { length: 5 }).notNull(), durationMin: integer("duration_min").notNull().default(60),
  status: varchar("status", { length: 20 }).notNull().default("confirmado"), location: text("location").notNull().default(""),
  responsible: text("responsible").notNull().default(""), notes: text("notes").notNull().default(""),
  paymentAmount: integer("payment_amount"), paymentDueDate: varchar("payment_due_date", { length: 10 }),
  paymentPaid: boolean("payment_paid").notNull().default(false), createdAt: ts(), updatedAt: upd(),
});
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(), title: text("title").notNull(), description: text("description").notNull().default(""),
  assignee: text("assignee").notNull().default(""), employeeId: integer("employee_id"),
  priority: varchar("priority", { length: 10 }).notNull().default("media"), clientId: integer("client_id"),
  serviceId: integer("service_id"), dueDate: varchar("due_date", { length: 10 }), done: boolean("done").notNull().default(false),
  appointmentId: integer("appointment_id"), createdAt: ts(), updatedAt: upd(),
});
export const settings = pgTable("settings", { key: text("key").primaryKey(), value: text("value").notNull() });
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(), name: text("name").notNull(), phone: text("phone").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""), email: text("email").notNull().default(""),
  address: text("address").notNull().default(""), birthDate: varchar("birth_date", { length: 10 }),
  origin: text("origin").notNull().default(""), notes: text("notes").notNull().default(""), createdAt: ts(), updatedAt: upd(),
});
export const catalogServices = pgTable("catalog_services", {
  id: serial("id").primaryKey(), name: text("name").notNull(), category: varchar("category", { length: 30 }).notNull(),
  description: text("description").notNull().default(""), price: integer("price").notNull().default(0),
  durationMin: integer("duration_min").notNull().default(60), paymentTerms: text("payment_terms").notNull().default(""),
  responsible: text("responsible").notNull().default(""), notes: text("notes").notNull().default(""), createdAt: ts(), updatedAt: upd(),
});
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(), clientId: integer("client_id").notNull(), discount: integer("discount").notNull().default(0),
  validUntil: varchar("valid_until", { length: 10 }), status: varchar("status", { length: 20 }).notNull().default("rascunho"),
  notes: text("notes").notNull().default(""), appointmentId: integer("appointment_id"), createdAt: ts(), updatedAt: upd(),
});
export const budgetItems = pgTable("budget_items", {
  id: serial("id").primaryKey(), budgetId: integer("budget_id").notNull(), serviceId: integer("service_id"),
  serviceName: text("service_name").notNull(), unitPrice: integer("unit_price").notNull().default(0), quantity: integer("quantity").notNull().default(1),
});
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(), clientId: integer("client_id").notNull(), date: varchar("date", { length: 10 }).notNull(),
  channel: varchar("channel", { length: 20 }).notNull().default("whatsapp"), summary: text("summary").notNull(), createdAt: ts(),
});
export const clientFiles = pgTable("client_files", {
  id: serial("id").primaryKey(), clientId: integer("client_id").notNull(), name: text("name").notNull(),
  kind: text("kind").notNull().default("Documento"), notes: text("notes").notNull().default(""), createdAt: ts(),
});
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(), clientId: integer("client_id").notNull(), title: text("title").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("rascunho"), amount: integer("amount"),
  date: varchar("date", { length: 10 }), notes: text("notes").notNull().default(""), budgetId: integer("budget_id"),
  templateId: integer("template_id"), category: varchar("category", { length: 30 }), serviceLabel: text("service_label").notNull().default(""),
  eventDate: varchar("event_date", { length: 10 }), location: text("location").notNull().default(""),
  body: text("body").notNull().default(""), currentVersion: integer("current_version").notNull().default(1), createdAt: ts(), updatedAt: upd(),
});
export const contractTemplates = pgTable("contract_templates", {
  id: serial("id").primaryKey(), category: varchar("category", { length: 30 }).notNull(), title: text("title").notNull(),
  body: text("body").notNull().default(""), createdAt: ts(), updatedAt: upd(),
});
export const contractVersions = pgTable("contract_versions", {
  id: serial("id").primaryKey(), contractId: integer("contract_id").notNull(), version: integer("version").notNull(),
  title: text("title").notNull(), body: text("body").notNull().default(""), amount: integer("amount"),
  eventDate: varchar("event_date", { length: 10 }), location: text("location").notNull().default(""),
  editedBy: text("edited_by").notNull().default(""), createdAt: ts(),
});
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(), clientId: integer("client_id").notNull(), contractId: integer("contract_id"),
  name: text("name").notNull(), kind: varchar("kind", { length: 30 }).notNull().default("outro"),
  date: varchar("date", { length: 10 }).notNull(), notes: text("notes").notNull().default(""), createdAt: ts(),
});
export const syncLog = pgTable("sync_log", {
  id: serial("id").primaryKey(), direction: varchar("direction", { length: 20 }).notNull().default("bidirecional"),
  createdCount: integer("created_count").notNull().default(0), updatedCount: integer("updated_count").notNull().default(0),
  cancelledCount: integer("cancelled_count").notNull().default(0), errors: text("errors").notNull().default(""), createdAt: ts(),
});
export const syncConflicts = pgTable("sync_conflicts", {
  id: serial("id").primaryKey(), appointmentId: integer("appointment_id"), title: text("title").notNull(),
  googleEventId: text("google_event_id"), studioDate: varchar("studio_date", { length: 10 }).notNull(),
  studioStartTime: varchar("studio_start_time", { length: 5 }).notNull(), studioDurationMin: integer("studio_duration_min").notNull().default(60),
  googleDate: varchar("google_date", { length: 10 }).notNull(), googleStartTime: varchar("google_start_time", { length: 5 }).notNull(),
  googleDurationMin: integer("google_duration_min").notNull().default(60),
  status: varchar("status", { length: 30 }).notNull().default("pendente"), createdAt: ts(), resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});
export const installments = pgTable("installments", {
  id: serial("id").primaryKey(), clientId: integer("client_id").notNull(), clientName: text("client_name").notNull().default(""),
  budgetId: integer("budget_id"), appointmentId: integer("appointment_id"), title: text("title").notNull(),
  serviceName: text("service_name").notNull().default(""), kind: varchar("kind", { length: 20 }).notNull().default("integral"),
  number: integer("number").notNull().default(1), totalParts: integer("total_parts").notNull().default(1),
  dueDate: varchar("due_date", { length: 10 }).notNull(), amount: integer("amount").notNull().default(0),
  paidAmount: integer("paid_amount").notNull().default(0), paidDate: varchar("paid_date", { length: 10 }),
  paymentMethod: varchar("payment_method", { length: 20 }), receiptInfo: text("receipt_info").notNull().default(""),
  registeredBy: text("registered_by").notNull().default(""), cancelled: boolean("cancelled").notNull().default(false), createdAt: ts(), updatedAt: upd(),
});
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(), description: text("description").notNull(), category: varchar("category", { length: 20 }).notNull().default("outros"),
  supplier: text("supplier").notNull().default(""), dueDate: varchar("due_date", { length: 10 }).notNull(),
  amount: integer("amount").notNull().default(0), paidAmount: integer("paid_amount").notNull().default(0),
  paidDate: varchar("paid_date", { length: 10 }), paymentMethod: varchar("payment_method", { length: 20 }),
  receiptInfo: text("receipt_info").notNull().default(""), registeredBy: text("registered_by").notNull().default(""),
  notes: text("notes").notNull().default(""), cancelled: boolean("cancelled").notNull().default(false), createdAt: ts(), updatedAt: upd(),
});
export const financeHistory = pgTable("finance_history", {
  id: serial("id").primaryKey(), type: varchar("type", { length: 20 }).notNull(), kind: varchar("kind", { length: 10 }).notNull(),
  installmentId: integer("installment_id"), expenseId: integer("expense_id"), description: text("description").notNull(),
  date: varchar("date", { length: 10 }), amount: integer("amount"), method: varchar("method", { length: 20 }),
  detail: text("detail").notNull().default(""), actor: text("actor").notNull().default(""), createdAt: ts(),
});
export const waConversations = pgTable("wa_conversations", {
  id: serial("id").primaryKey(), clientId: integer("client_id"), contactName: text("contact_name").notNull().default(""),
  phone: text("phone").notNull().default(""), status: varchar("status", { length: 30 }).notNull().default("aguardando-atendimento"), createdAt: ts(), updatedAt: upd(),
});
export const waMessages = pgTable("wa_messages", {
  id: serial("id").primaryKey(), conversationId: integer("conversation_id").notNull(),
  direction: varchar("direction", { length: 10 }).notNull().default("recebida"),
  source: varchar("source", { length: 10 }).notNull().default("manual"), body: text("body").notNull(), createdAt: ts(),
});
export const waSuggestions = pgTable("wa_suggestions", {
  id: serial("id").primaryKey(), conversationId: integer("conversation_id").notNull(), messageId: integer("message_id"),
  clientId: integer("client_id"), title: text("title").notNull().default(""), date: varchar("date", { length: 10 }),
  startTime: varchar("start_time", { length: 5 }), durationMin: integer("duration_min").notNull().default(60),
  serviceType: varchar("service_type", { length: 30 }), serviceId: integer("service_id"),
  serviceLabel: text("service_label").notNull().default(""), intent: varchar("intent", { length: 20 }),
  status: varchar("status", { length: 20 }).notNull().default("pendente"), appointmentId: integer("appointment_id"), createdAt: ts(), updatedAt: upd(),
});
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull().default(""),
  role: varchar("role", { length: 20 }).notNull().default("atendimento"), phone: text("phone").notNull().default(""),
  active: boolean("active").notNull().default(true), mustChangePassword: boolean("must_change_password").notNull().default(true),
  passwordHash: text("password_hash").notNull().default(""), passwordSetAt: timestamp("password_set_at", { withTimezone: true }),
  passwordSetBy: text("password_set_by").notNull().default(""), customPermissions: text("custom_permissions").notNull().default(""), createdAt: ts(), updatedAt: upd(),
});
export const productionCards = pgTable("production_cards", {
  id: serial("id").primaryKey(), title: text("title").notNull(), clientId: integer("client_id"),
  clientName: text("client_name").notNull().default(""), serviceId: integer("service_id"),
  serviceLabel: text("service_label").notNull().default(""), serviceType: varchar("service_type", { length: 30 }),
  appointmentId: integer("appointment_id"), budgetId: integer("budget_id"),
  stage: varchar("stage", { length: 40 }).notNull().default("solicitacao-recebida"),
  responsible: text("responsible").notNull().default(""), employeeId: integer("employee_id"),
  stageDueDate: varchar("stage_due_date", { length: 10 }), eventDate: varchar("event_date", { length: 10 }),
  amount: integer("amount"), basis: text("basis").notNull().default(""), notes: text("notes").notNull().default(""), createdAt: ts(), updatedAt: upd(),
});
export const systemActivity = pgTable("system_activity", {
  id: serial("id").primaryKey(), actor: text("actor").notNull().default(""), actorEmployeeId: integer("actor_employee_id"),
  type: varchar("type", { length: 20 }).notNull(), description: text("description").notNull(), createdAt: ts(),
});
export const releaseChecks = pgTable("release_checks", {
  id: serial("id").primaryKey(), key: text("key").notNull().unique(), area: text("area").notNull(), title: text("title").notNull(),
  description: text("description").notNull().default(""), kind: varchar("kind", { length: 20 }).notNull().default("manual"),
  status: varchar("status", { length: 20 }).notNull().default("pendente"), result: text("result").notNull().default(""),
  note: text("note").notNull().default(""), checkedBy: text("checked_by").notNull().default(""), sort: integer("sort").notNull().default(0), updatedAt: upd(),
});
export const simTests = pgTable("sim_tests", {
  id: serial("id").primaryKey(), ok: boolean("ok").notNull().default(false), summary: text("summary").notNull().default(""),
  details: text("details").notNull().default(""), ranBy: text("ran_by").notNull().default(""), createdAt: ts(),
});
export const publicationSteps = pgTable("publication_steps", {
  id: serial("id").primaryKey(), key: text("key").notNull().unique(), scope: varchar("scope", { length: 20 }).notNull().default("app"),
  title: text("title").notNull(), description: text("description").notNull().default(""),
  state: varchar("state", { length: 20 }).notNull().default("pendente"), note: text("note").notNull().default(""),
  sort: integer("sort").notNull().default(0), updatedAt: upd(),
});
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(), clientId: integer("client_id").notNull(), text: text("text").notNull(), createdAt: ts(),
});
// Referências para evitar imports não usados em build estrito:
export const _ENUMS = { SERVICE_TYPES, SERVICE_CATEGORIES, BUDGET_STATUSES, CONTRACT_STATUSES, CONVERSATION_CHANNELS, PAYMENT_METHODS, EXPENSE_CATEGORIES, WA_CONVERSATION_STATUSES, WA_INTENTS, WA_SUGGESTION_STATUSES, EMPLOYEE_ROLES, PRODUCTION_STAGES, DOCUMENT_KINDS };
