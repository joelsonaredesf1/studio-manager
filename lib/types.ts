// Tipos portados do esquema original (SQLite -> Postgres: mesmos campos, ids serial).
export interface Client { id:number; name:string; phone:string; whatsapp:string; email:string; address:string; birthDate:string|null; origin:string; notes:string; createdAt:string }
export interface CatalogService { id:number; name:string; category:string; description:string; price:number; durationMin:number; paymentTerms:string; responsible:string; notes:string }
export interface BudgetItem { id:number; budgetId:number; serviceId:number|null; serviceName:string; unitPrice:number; quantity:number }
export interface Budget { id:number; clientId:number; discount:number; validUntil:string|null; status:string; notes:string; appointmentId:number|null; items:BudgetItem[]; total:number }
export interface Appointment { id:number; title:string; clientName:string; clientId:number|null; serviceId:number|null; googleEventId:string|null; origin:string; serviceType:string; date:string; startTime:string; durationMin:number; status:string; location:string; responsible:string; notes:string; paymentAmount:number|null; paymentDueDate:string|null; paymentPaid:boolean }
export interface TaskItem { id:number; title:string; description:string; assignee:string; employeeId:number|null; priority:string; clientId:number|null; serviceId:number|null; dueDate:string|null; done:boolean; appointmentId:number|null }
export interface Installment { id:number; clientId:number; clientName:string; budgetId:number|null; appointmentId:number|null; title:string; serviceName:string; kind:string; number:number; totalParts:number; dueDate:string; amount:number; paidAmount:number; paidDate:string|null; paymentMethod:string|null; receiptInfo:string; registeredBy:string; cancelled:boolean }
export interface Expense { id:number; description:string; category:string; supplier:string; dueDate:string; amount:number; paidAmount:number; paidDate:string|null; paymentMethod:string|null; receiptInfo:string; registeredBy:string; notes:string; cancelled:boolean }
export interface FinanceHistoryItem { id:number; type:string; kind:string; installmentId:number|null; expenseId:number|null; description:string; date:string|null; amount:number|null; method:string|null; detail:string; actor:string }
export interface Employee { id:number; name:string; email:string; role:string; phone:string; active:boolean; mustChangePassword:boolean; passwordHash:string; passwordSetAt?:string|null; passwordSetBy?:string; customPermissions:string }
export interface ProductionCard { id:number; title:string; clientId:number|null; clientName:string; serviceId:number|null; serviceLabel:string; serviceType:string|null; appointmentId:number|null; budgetId:number|null; stage:string; responsible:string; employeeId:number|null; stageDueDate:string|null; eventDate:string|null; amount:number|null; basis:string; notes:string }
export interface ContractTemplate { id:number; category:string; title:string; body:string }
export interface ContractVersion { id:number; contractId:number; version:number; title:string; body:string; amount:number|null; eventDate:string|null; location:string; editedBy:string; createdAt:string }
export interface ContractItem { id:number; clientId:number; title:string; status:string; amount:number|null; date:string|null; notes:string; budgetId:number|null; templateId:number|null; category:string|null; serviceLabel:string; eventDate:string|null; location:string; body:string; currentVersion:number }
export interface DocItem { id:number; clientId:number; contractId:number|null; name:string; kind:string; date:string; notes:string }
export interface WaConversation { id:number; clientId:number|null; contactName:string; phone:string; status:string }
export interface WaMessage { id:number; conversationId:number; direction:string; source:string; body:string; createdAt:string }
export interface WaSuggestion { id:number; conversationId:number; messageId:number|null; clientId:number|null; title:string; date:string|null; startTime:string|null; durationMin:number; serviceType:string|null; serviceId:number|null; serviceLabel:string; intent:string|null; status:string; appointmentId:number|null }
export interface ReleaseCheck { key:string; area:string; title:string; description:string; kind:string; status:string; result:string; note:string; checkedBy:string }
export interface PublicationStep { key:string; scope:string; title:string; description:string; state:string; note:string }
export interface Overview {
  appointments: Appointment[]; tasks: TaskItem[]; clients: Client[]; services: CatalogService[];
  budgets: Budget[]; installments: Installment[]; expenses: Expense[]; financeHistory: FinanceHistoryItem[];
  employees: Employee[]; productionCards: ProductionCard[]; templates: ContractTemplate[];
  contracts: ContractItem[]; contractVersions: ContractVersion[]; documents: DocItem[];
  waConversations: WaConversation[]; waMessages: WaMessage[]; waSuggestions: WaSuggestion[];
  releaseChecks: ReleaseCheck[]; publicationSteps: PublicationStep[];
  googleConnected: boolean; whatsappConnected: boolean; whatsappConfig: { phoneNumber:string; phoneNumberId:string; webhookStatus:string };
  seedLoaded: boolean; dbConfigured?: boolean;
}
