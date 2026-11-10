// Constantes portadas de server/src/schema.ts (origem, somente leitura).
export const SERVICE_TYPES = ["casamento","15-anos","gestante","newborn","aniversario","ensaio","formatura","corporativo","produtos","outro"] as const;
export const SERVICE_TYPE_LABELS: Record<string,string> = {
  casamento:"Casamento","15-anos":"Festa de 15 anos",gestante:"Ensaio de gestante",newborn:"Ensaio newborn",
  aniversario:"Aniversário",ensaio:"Ensaio",formatura:"Formatura",corporativo:"Eventos corporativos",produtos:"Fotografia de produtos",outro:"Outro",
};
// As 13 categorias do catálogo (Fase 3) — usadas também no Balanço por tipo de serviço (Fase 5).
export const SERVICE_CATEGORIES = ["fotografia-individual","casamento","festa-15-anos","aniversario","gestante","infantil","newborn","casal","familia","formatura","corporativo","produtos","outros"] as const;
export const CATEGORY_LABELS: Record<string,string> = {
  "fotografia-individual":"Fotografia individual",casamento:"Casamento","festa-15-anos":"Festa de 15 anos",
  aniversario:"Aniversário",gestante:"Ensaio de gestante",infantil:"Ensaio infantil",newborn:"Ensaio newborn",
  casal:"Ensaio de casal",familia:"Ensaio de família",formatura:"Formatura",corporativo:"Eventos corporativos",
  produtos:"Fotografia de produtos",outros:"Outros",
};
export const BUDGET_STATUSES = ["rascunho","enviado","aprovado","recusado","expirado"] as const;
export const CONTRACT_STATUSES = ["rascunho","enviado","aguardando-assinatura","assinado","cancelado"] as const;
export const PAYMENT_METHODS = ["pix","dinheiro","cartao-credito","cartao-debito","transferencia","boleto"] as const;
export const EXPENSE_CATEGORIES = ["equipamentos","aluguel","marketing","software","equipe","transporte","materiais","impostos","outros"] as const;
export const EMPLOYEE_ROLES = ["administrador","gerente","atendimento","fotografo"] as const;
export const ROLE_LABELS: Record<string,string> = { administrador:"Administrador",gerente:"Gerente",atendimento:"Atendimento",fotografo:"Fotógrafo" };
export const PERMISSION_MODULES = ["planner","clientes","financeiro","whatsapp","producao"] as const;
export const PERMISSION_ACTIONS = ["ver","criar","editar","excluir"] as const;
export const ROLE_PERMISSIONS: Record<string, Record<string, Record<string, boolean>>> = {
  administrador: { planner:{ver:true,criar:true,editar:true,excluir:true}, clientes:{ver:true,criar:true,editar:true,excluir:true}, financeiro:{ver:true,criar:true,editar:true,excluir:true}, whatsapp:{ver:true,criar:true,editar:true,excluir:true}, producao:{ver:true,criar:true,editar:true,excluir:true} },
  gerente: { planner:{ver:true,criar:true,editar:true,excluir:true}, clientes:{ver:true,criar:true,editar:true,excluir:false}, financeiro:{ver:true,criar:true,editar:true,excluir:false}, whatsapp:{ver:true,criar:true,editar:true,excluir:true}, producao:{ver:true,criar:true,editar:true,excluir:true} },
  atendimento: { planner:{ver:true,criar:true,editar:true,excluir:false}, clientes:{ver:true,criar:true,editar:true,excluir:false}, financeiro:{ver:true,criar:false,editar:false,excluir:false}, whatsapp:{ver:true,criar:true,editar:true,excluir:false}, producao:{ver:true,criar:false,editar:false,excluir:false} },
  fotografo: { planner:{ver:true,criar:false,editar:false,excluir:false}, clientes:{ver:true,criar:false,editar:false,excluir:false}, financeiro:{ver:false,criar:false,editar:false,excluir:false}, whatsapp:{ver:false,criar:false,editar:false,excluir:false}, producao:{ver:true,criar:false,editar:true,excluir:false} },
};
export const PRODUCTION_STAGES = ["solicitacao-recebida","orcamento-enviado","aguardando-aprovacao","contrato-assinado","pagamento-recebido","ensaio-agendado","ensaio-realizado","fotos-em-edicao","aguardando-aprovacao-material","material-entregue","servico-concluido"] as const;
export const PRODUCTION_STAGE_LABELS: Record<string,string> = {
  "solicitacao-recebida":"Solicitação recebida","orcamento-enviado":"Orçamento enviado","aguardando-aprovacao":"Aguardando aprovação",
  "contrato-assinado":"Contrato assinado","pagamento-recebido":"Pagamento recebido","ensaio-agendado":"Ensaio agendado",
  "ensaio-realizado":"Ensaio realizado","fotos-em-edicao":"Fotografias em edição","aguardando-aprovacao-material":"Aguardando aprovação",
  "material-entregue":"Material entregue","servico-concluido":"Serviço concluído",
};
export const CONVERSATION_CHANNELS = ["whatsapp","telefone","email","presencial","instagram","outro"] as const;
export const WA_INTENTS = ["orcamento","agendamento","alteracao"] as const;
export const WA_SUGGESTION_STATUSES = ["pendente","aprovada","recusada"] as const;
export const WA_CONVERSATION_STATUSES = ["aguardando-atendimento","em-atendimento","aguardando-cliente","resolvido"] as const;
export const DOCUMENT_KINDS = ["contrato","orcamento","documento-cliente","comprovante","nota-fiscal","autorizacao-imagem","outro"] as const;
// Checklist da Fase 9: 6 automáticos + 11 manuais = 17 itens.
export const RELEASE_CHECKS_SEED = [
  { key:"integridade-cadastros", area:"Dados", title:"Integridade dos cadastros", description:"Sem clientes, orçamentos ou compromissos órfãos.", kind:"automatico" },
  { key:"historico-financeiro", area:"Financeiro", title:"Histórico financeiro permanente", description:"Baixas e cancelamentos preservados, sem apagar movimentações.", kind:"automatico" },
  { key:"versoes-contrato", area:"Contratos", title:"Versões de contrato preservadas", description:"Edições criam nova versão sem apagar as anteriores.", kind:"automatico" },
  { key:"matriz-permissoes", area:"Funcionários", title:"Matriz de permissões", description:"Permissões por perfil conferidas regra a regra.", kind:"automatico" },
  { key:"vinculos-modulos", area:"Dados", title:"Vínculos entre módulos", description:"Cliente → orçamento → agendamento → contrato → financeiro íntegros.", kind:"automatico" },
  { key:"perfis-ativos", area:"Funcionários", title:"4 perfis ativos", description:"Administrador, Gerente, Atendimento e Fotógrafo ativos.", kind:"automatico" },
  { key:"teste-fluxo-casamento", area:"Fluxo", title:"Fluxo completo de um casamento", description:"Orçamento → aprovação → agendamento → contrato → baixa.", kind:"manual" },
  { key:"teste-fluxo-ensaio", area:"Fluxo", title:"Fluxo completo de um ensaio", description:"Orçamento → agendamento → produção → entrega.", kind:"manual" },
  { key:"teste-whatsapp", area:"WhatsApp", title:"Atendimento e pré-agendamento", description:"Solicitação registrada e aprovada por uma pessoa.", kind:"manual" },
  { key:"teste-kanban", area:"Produção", title:"Kanban com os trabalhos reais", description:"Cartões só de orçamentos/agendamentos reais, movidos manualmente.", kind:"manual" },
  { key:"teste-relatorios", area:"Relatórios", title:"Relatórios com dados reais", description:"Faturamento e balanço por serviço conferidos com o Financeiro.", kind:"manual" },
  { key:"teste-pdf-contrato", area:"Contratos", title:"PDF de contrato e de orçamento", description:"PDF gerado e conferido com os dados do cliente.", kind:"manual" },
  { key:"teste-senhas", area:"Acesso", title:"Troca de senha no primeiro acesso", description:"Senha inicial trocada por cada funcionário.", kind:"manual" },
  { key:"teste-celular", area:"Uso", title:"Uso no celular", description:"Navegação, Planner e Kanban conferidos no celular.", kind:"manual" },
  { key:"teste-google-agenda", area:"Integrações", title:"Google Agenda: status visível", description:"Se não conectada, o painel mostra Não conectado (sem fingir).", kind:"manual" },
  { key:"backup-dados", area:"Dados", title:"Rotina de backup/exportação", description:"Exportação de clientes e financeiro conferida.", kind:"manual" },
  { key:"manual-equipe", area:"Uso", title:"Manual lido pela equipe", description:"Cada funcionário leu o manual do seu módulo.", kind:"manual" },
] as const;
export const PUBLICATION_STEPS_SEED = [
  { key:"app-pronto", scope:"app", title:"Aplicativo pronto para uso", description:"Módulos, permissões e senhas configurados.", state:"pronto" },
  { key:"hospedagem", scope:"externo", title:"Hospedagem contratada (Vercel)", description:"Projeto importado do GitHub na Vercel, plano Hobby ou Pro.", state:"em-andamento" },
  { key:"banco", scope:"externo", title:"Banco de dados (Supabase)", description:"Projeto Supabase criado e migrations aplicadas.", state:"em-andamento" },
  { key:"dominio", scope:"externo", title:"Domínio próprio", description:"Domínio registrado e apontado para a Vercel. Ainda não contratado = pendente.", state:"pendente" },
  { key:"google-agenda", scope:"externo", title:"Google Agenda do estúdio", description:"Conta Google do estúdio conectada. Sem ela, o status fica Não conectado.", state:"pendente" },
  { key:"whatsapp-cloud", scope:"externo", title:"WhatsApp Business Cloud API", description:"Conta Meta, número, token e webhook. Sem ela, só registro manual.", state:"pendente" },
  { key:"gateway", scope:"externo", title:"Gateway de pagamento", description:"Mercado Pago ou Asaas — escolha e credenciais do dono do estúdio.", state:"pendente" },
  { key:"assinatura", scope:"externo", title:"Assinatura eletrônica", description:"Provedor de assinatura eletrônica a escolher.", state:"pendente" },
] as const;
export const fmtMoney = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((cents || 0) / 100);
export const todayISO = () => new Date().toISOString().slice(0, 10);
