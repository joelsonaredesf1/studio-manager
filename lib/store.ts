// Armazenamento em memória (modo sem banco) + seed.
// Quando DATABASE_URL estiver configurada, a API passa a persistir no Postgres
// via lib/db.ts (esquema em lib/schema.ts + drizzle/0001_init.sql).
// Em produção na Vercel sem banco, os dados vivem só na instância — por isso
// o README exige configurar o Supabase antes do uso real com a equipe.
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { Overview } from "./types";
import { RELEASE_CHECKS_SEED, PUBLICATION_STEPS_SEED } from "./constants";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [, salt, hash] = stored.split("$");
    const calc = scryptSync(password, salt, 64);
    const buf = Buffer.from(hash, "hex");
    return buf.length === calc.length && timingSafeEqual(buf, calc);
  } catch { return false; }
}
export const sessionToken = (employeeId: number) =>
  createHash("sha256").update(`${employeeId}:${process.env.SESSION_SECRET || "studio-manager-dev-secret"}:${new Date().toISOString().slice(0,10)}`).digest("hex");

const now = () => new Date().toISOString();
let nextId = 100;
const nid = () => nextId++;

function seed(): Overview {
  const pw = hashPassword("studio123"); // senha inicial provisória — TROCAR no primeiro acesso (ver README)
  return {
    appointments: [
      { id: 1, title: "Casamento — Marina e Carlos", clientName: "Marina Silva", clientId: 1, serviceId: 1, googleEventId: null, origin: "studio", serviceType: "casamento", date: "2026-11-21", startTime: "16:00", durationMin: 240, status: "confirmado", location: "Sítio Boa Vista", responsible: "Administrador", notes: "Cerimônia ao ar livre.", paymentAmount: 500000, paymentDueDate: "2026-11-21", paymentPaid: false },
      { id: 2, title: "Ensaio gestante — Juliana", clientName: "Juliana Costa", clientId: 2, serviceId: 2, googleEventId: null, origin: "studio", serviceType: "gestante", date: "2026-11-14", startTime: "09:00", durationMin: 90, status: "confirmado", location: "Estúdio", responsible: "Fotógrafo", notes: "", paymentAmount: 45000, paymentDueDate: "2026-11-14", paymentPaid: false },
      { id: 3, title: "15 anos — Alice", clientName: "Alice Santos", clientId: 3, serviceId: 3, googleEventId: null, origin: "studio", serviceType: "15-anos", date: "2026-12-05", startTime: "19:00", durationMin: 300, status: "confirmado", location: "Salão de festas", responsible: "Gerente", notes: "", paymentAmount: 320000, paymentDueDate: "2026-12-05", paymentPaid: false },
    ],
    tasks: [
      { id: 1, title: "Editar fotos do ensaio da Juliana", description: "Seleção + tratamento.", assignee: "Fotógrafo", employeeId: 4, priority: "alta", clientId: 2, serviceId: 2, dueDate: "2026-11-15", done: false, appointmentId: 2 },
      { id: 2, title: "Enviar prévia do álbum da Marina", description: "", assignee: "Gerente", employeeId: 2, priority: "media", clientId: 1, serviceId: 1, dueDate: "2026-11-18", done: false, appointmentId: 1 },
    ],
    clients: [
      { id: 1, name: "Marina Silva", phone: "(31) 99999-0001", whatsapp: "(31) 99999-0001", email: "marina@exemplo.com", address: "", birthDate: null, origin: "indicação", notes: "Casamento em 21/11.", createdAt: now() },
      { id: 2, name: "Juliana Costa", phone: "(31) 99999-0002", whatsapp: "(31) 99999-0002", email: "", address: "", birthDate: null, origin: "instagram", notes: "", createdAt: now() },
      { id: 3, name: "Alice Santos", phone: "(31) 99999-0003", whatsapp: "(31) 99999-0003", email: "", address: "", birthDate: null, origin: "whatsapp", notes: "15 anos em 05/12.", createdAt: now() },
    ],
    services: [
      { id: 1, name: "Casamento completo", category: "casamento", description: "Cerimônia + festa, álbum e cobertura completa.", price: 500000, durationMin: 480, paymentTerms: "Entrada + 2 parcelas.", responsible: "Fotógrafo", notes: "" },
      { id: 2, name: "Ensaio de gestante", category: "gestante", description: "Ensaio no estúdio ou externo, 30 fotos tratadas.", price: 45000, durationMin: 90, paymentTerms: "À vista ou 2x.", responsible: "Fotógrafo", notes: "" },
      { id: 3, name: "Festa de 15 anos", category: "festa-15-anos", description: "Cobertura completa da festa.", price: 320000, durationMin: 300, paymentTerms: "Entrada + parcelas.", responsible: "Fotógrafo", notes: "" },
    ],
    budgets: [
      { id: 1, clientId: 1, discount: 0, validUntil: "2026-11-20", status: "aprovado", notes: "", appointmentId: 1, total: 500000,
        items: [{ id: 1, budgetId: 1, serviceId: 1, serviceName: "Casamento completo", unitPrice: 500000, quantity: 1 }] },
    ],
    installments: [
      { id: 1, clientId: 1, clientName: "Marina Silva", budgetId: 1, appointmentId: 1, title: "Entrada — Casamento", serviceName: "Casamento completo", kind: "entrada", number: 1, totalParts: 3, dueDate: "2026-11-10", amount: 200000, paidAmount: 200000, paidDate: "2026-11-10", paymentMethod: "pix", receiptInfo: "Comprovante PIX", registeredBy: "Administrador", cancelled: false },
      { id: 2, clientId: 1, clientName: "Marina Silva", budgetId: 1, appointmentId: 1, title: "Parcela 2/3 — Casamento", serviceName: "Casamento completo", kind: "parcela", number: 2, totalParts: 3, dueDate: "2026-11-21", amount: 150000, paidAmount: 0, paidDate: null, paymentMethod: null, receiptInfo: "", registeredBy: "", cancelled: false },
      { id: 3, clientId: 1, clientName: "Marina Silva", budgetId: 1, appointmentId: 1, title: "Parcela 3/3 — Casamento", serviceName: "Casamento completo", kind: "parcela", number: 3, totalParts: 3, dueDate: "2026-12-21", amount: 150000, paidAmount: 0, paidDate: null, paymentMethod: null, receiptInfo: "", registeredBy: "", cancelled: false },
    ],
    expenses: [
      { id: 1, description: "Aluguel do estúdio", category: "aluguel", supplier: "", dueDate: "2026-11-10", amount: 120000, paidAmount: 120000, paidDate: "2026-11-10", paymentMethod: "transferencia", receiptInfo: "", registeredBy: "Administrador", notes: "", cancelled: false },
    ],
    financeHistory: [
      { id: 1, type: "baixa", kind: "receita", installmentId: 1, expenseId: null, description: "Entrada — Casamento", date: "2026-11-10", amount: 200000, method: "pix", detail: "Baixa manual registrada.", actor: "Administrador" },
      { id: 2, type: "baixa", kind: "despesa", installmentId: null, expenseId: 1, description: "Aluguel do estúdio", date: "2026-11-10", amount: 120000, method: "transferencia", detail: "Baixa manual registrada.", actor: "Administrador" },
    ],
    employees: [
      { id: 1, name: "Administrador", email: "", role: "administrador", phone: "", active: true, mustChangePassword: true, passwordHash: pw, customPermissions: "" },
      { id: 2, name: "Gerente", email: "", role: "gerente", phone: "", active: true, mustChangePassword: true, passwordHash: pw, customPermissions: "" },
      { id: 3, name: "Atendimento", email: "", role: "atendimento", phone: "", active: true, mustChangePassword: true, passwordHash: pw, customPermissions: "" },
      { id: 4, name: "Fotógrafo", email: "", role: "fotografo", phone: "", active: true, mustChangePassword: true, passwordHash: pw, customPermissions: "" },
    ],
    productionCards: [
      { id: 1, title: "Casamento — Marina Silva", clientId: 1, clientName: "Marina Silva", serviceId: 1, serviceLabel: "Casamento completo", serviceType: "casamento", appointmentId: 1, budgetId: 1, stage: "ensaio-agendado", responsible: "Fotógrafo", employeeId: 4, stageDueDate: "2026-11-21", eventDate: "2026-11-21", amount: 500000, basis: "Orçamento aprovado + agendamento.", notes: "" },
      { id: 2, title: "Ensaio gestante — Juliana Costa", clientId: 2, clientName: "Juliana Costa", serviceId: 2, serviceLabel: "Ensaio de gestante", serviceType: "gestante", appointmentId: 2, budgetId: null, stage: "ensaio-agendado", responsible: "Fotógrafo", employeeId: 4, stageDueDate: "2026-11-14", eventDate: "2026-11-14", amount: 45000, basis: "Agendamento confirmado.", notes: "" },
      { id: 3, title: "15 anos — Alice Santos", clientId: 3, clientName: "Alice Santos", serviceId: 3, serviceLabel: "Festa de 15 anos", serviceType: "15-anos", appointmentId: 3, budgetId: null, stage: "ensaio-agendado", responsible: "Gerente", employeeId: 2, stageDueDate: "2026-12-05", eventDate: "2026-12-05", amount: 320000, basis: "Agendamento confirmado.", notes: "" },
    ],
    templates: [
      { id: 1, category: "casamento", title: "Contrato — Casamento", body: "Contrato de prestação de serviços fotográficos — Casamento. Contratante: {{cliente}}. Serviço: {{servico}}. Data do evento: {{data_evento}}. Local: {{local}}. Valor total: {{valor}}. Parcelas: {{parcelas}}." },
      { id: 2, category: "festa-15-anos", title: "Contrato — Festa de 15 anos", body: "Contrato de prestação de serviços fotográficos — Festa de 15 anos. Contratante: {{cliente}}. Serviço: {{servico}}. Data: {{data_evento}}. Local: {{local}}. Valor: {{valor}}." },
      { id: 3, category: "aniversario", title: "Contrato — Aniversário", body: "Contrato — Aniversário. Contratante: {{cliente}}. Data: {{data_evento}}. Local: {{local}}. Valor: {{valor}}." },
      { id: 4, category: "gestante", title: "Contrato — Ensaio de gestante", body: "Contrato — Ensaio de gestante. Contratante: {{cliente}}. Data: {{data_evento}}. Local: {{local}}. Valor: {{valor}}." },
      { id: 5, category: "fotografia-individual", title: "Contrato — Fotografia individual", body: "Contrato — Fotografia individual. Contratante: {{cliente}}. Data: {{data_evento}}. Valor: {{valor}}." },
      { id: 6, category: "infantil", title: "Contrato — Ensaio infantil", body: "Contrato — Ensaio infantil. Contratante: {{cliente}}. Data: {{data_evento}}. Valor: {{valor}}." },
      { id: 7, category: "newborn", title: "Contrato — Ensaio newborn", body: "Contrato — Ensaio newborn. Contratante: {{cliente}}. Data: {{data_evento}}. Valor: {{valor}}." },
      { id: 8, category: "casal", title: "Contrato — Ensaio de casal", body: "Contrato — Ensaio de casal. Contratante: {{cliente}}. Data: {{data_evento}}. Valor: {{valor}}." },
      { id: 9, category: "familia", title: "Contrato — Ensaio de família", body: "Contrato — Ensaio de família. Contratante: {{cliente}}. Data: {{data_evento}}. Valor: {{valor}}." },
      { id: 10, category: "formatura", title: "Contrato — Formatura", body: "Contrato — Formatura. Contratante: {{cliente}}. Data: {{data_evento}}. Valor: {{valor}}." },
      { id: 11, category: "corporativo", title: "Contrato — Eventos corporativos", body: "Contrato — Eventos corporativos. Contratante: {{cliente}}. Data: {{data_evento}}. Valor: {{valor}}." },
      { id: 12, category: "produtos", title: "Contrato — Fotografia de produtos", body: "Contrato — Fotografia de produtos. Contratante: {{cliente}}. Data: {{data_evento}}. Valor: {{valor}}." },
      { id: 13, category: "outros", title: "Contrato — Outros serviços", body: "Contrato — Outros serviços. Contratante: {{cliente}}. Data: {{data_evento}}. Valor: {{valor}}." },
    ],
    contracts: [
      { id: 1, clientId: 1, title: "Contrato — Casamento — Marina Silva", status: "rascunho", amount: 500000, date: "2026-11-10", notes: "", budgetId: 1, templateId: 1, category: "casamento", serviceLabel: "Casamento completo", eventDate: "2026-11-21", location: "Sítio Boa Vista", body: "Contrato de prestação de serviços fotográficos — Casamento. Contratante: Marina Silva. Serviço: Casamento completo. Data do evento: 2026-11-21. Local: Sítio Boa Vista. Valor total: R$ 5.000,00.", currentVersion: 1 },
    ],
    contractVersions: [
      { id: 1, contractId: 1, version: 1, title: "Contrato — Casamento — Marina Silva", body: "Contrato de prestação de serviços fotográficos — Casamento. Contratante: Marina Silva.", amount: 500000, eventDate: "2026-11-21", location: "Sítio Boa Vista", editedBy: "Administrador", createdAt: now() },
    ],
    documents: [{ id: 1, clientId: 1, contractId: 1, name: "Contrato — Casamento — Marina Silva", kind: "contrato", date: "2026-11-10", notes: "" }],
    waConversations: [{ id: 1, clientId: 2, contactName: "Juliana Costa", phone: "(31) 99999-0002", status: "em-atendimento" }],
    waMessages: [{ id: 1, conversationId: 1, direction: "recebida", source: "manual", body: "Oi! Quero saber o valor do ensaio de gestante.", createdAt: now() }],
    waSuggestions: [{ id: 1, conversationId: 1, messageId: 1, clientId: 2, title: "Ensaio de gestante — Juliana", date: null, startTime: null, durationMin: 90, serviceType: "gestante", serviceId: 2, serviceLabel: "Ensaio de gestante", intent: "orcamento", status: "pendente", appointmentId: null }],
    releaseChecks: RELEASE_CHECKS_SEED.map((c, i) => ({ ...c, status: "pendente", result: "", note: "", checkedBy: "" })),
    publicationSteps: PUBLICATION_STEPS_SEED.map((s, i) => ({ ...s, note: "" })),
    googleConnected: false,
    whatsappConnected: false,
    whatsappConfig: { phoneNumber: "", phoneNumberId: "", webhookStatus: "nao-configurado" },
    seedLoaded: true,
  };
}

// Singleton em memória (serverless: cada instância tem sua cópia — ver README).
const g = globalThis as unknown as { __sm?: Overview };
export function getStore(): Overview {
  if (!g.__sm) g.__sm = seed();
  return g.__sm;
}
export function resetStore() { g.__sm = seed(); return g.__sm; }
// Cópia fresca do seed (usada pelo seed do Postgres — não toca o singleton).
export function freshSeed(): Overview { return seed(); }
// No modo Postgres, novos ids precisam começar acima do maior id já no banco.
export function setNextIdBase(n: number) { if (n > nextId) nextId = n; }
export { nid };
