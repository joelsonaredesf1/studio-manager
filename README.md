# Studio Manager — versão para hospedagem externa

Projeto **novo e separado** do app original do Muse (`studio-manager-fase-2-planner`).
O app original **não foi alterado** — este projeto é uma portabilidade para
Next.js (App Router, TypeScript) pronta para **Vercel Hobby (grátis) + Supabase Postgres (grátis)**.

> Repositório do usuário: `https://github.com/joelsonaredesf1/studio-manager.git`
> (repositório vazio, criado por ele em 2026-11-10; este projeto ainda **não** foi enviado para lá — ver passo 4.)

## O que foi portado

- **Esquema completo (28 tabelas)** em `lib/schema.ts` (Drizzle / Postgres) e
  `drizzle/0001_init.sql` — traduzido das migrations SQLite 0001–0009:
  clientes, catálogo de serviços (13 categorias), orçamentos e itens,
  compromissos/agenda, tarefas, financeiro (parcelas, despesas, histórico
  permanente), WhatsApp (conversas, mensagens, sugestões), funcionários,
  permissões por perfil, Kanban de produção (11 etapas), contratos, 13 modelos,
  versões de contrato, documentos, Google Agenda (log e conflitos), testes de
  lançamento (17 itens), teste simultâneo e passos de publicação.
- **Rotas de API** em `app/api/*` substituindo as server actions do Hatch SDK
  (`@hatch/space-sdk` **não existe** fora do Muse e foi removido):
  `auth`, `overview`, `planner`, `clients`, `finance`, `whatsapp`, `team`,
  `production`, `contracts`, `reports`, `release`, `seed`.
- **Interface** em `app/page.tsx` + `components/Sections.tsx`, visual
  branco/preto/cinza/dourado, em pt-BR: Planner (mensal/semanal/diário, alerta
  de conflito sem bloquear), Clientes e Serviços (ficha única, 13 categorias,
  orçamentos — aprovar gera agendamento + parcelas + cartão no Kanban),
  Financeiro (visão geral, contas a receber/pagar, **baixa manual**, balanço
  por tipo de serviço com os 13 tipos), WhatsApp Business (registro manual,
  leitura inteligente simples, pré-agendamento com aprovação humana),
  Funcionários e Produção (4 perfis, permissões, tarefas, Kanban 11 etapas,
  histórico), Contratos e Relatórios (13 modelos, versões numeradas,
  documentos, relatórios com dados reais, exportação CSV), Publicação
  (checklist de 17 itens — 6 automáticos + 11 manuais —, teste simultâneo,
  senhas com hash, manual).
- **Login simples por perfil/senha** com hash scrypt (nunca em texto puro).
  Perfis iniciais: **Administrador, Gerente, Atendimento e Fotógrafo**.
  Senha inicial de todos: **`studio123`** — trocar no primeiro acesso
  (tela de login avisa, ou Publicação → Senhas e acesso). **Troque antes de
  abrir o acesso à equipe.**

## O que NÃO está ligado (sem fingir integração)

- **Google Agenda: Não conectado.** A sincronização real depende da conta
  Google do estúdio (OAuth) — pendente desde a tentativa de 2026-11-09
  (`access_denied`).
- **WhatsApp: Não conectado.** Mensagens reais exigem conta WhatsApp Business
  Cloud API (Meta), número, token e webhook. O app só registra mensagens
  manualmente; preencher número/ID/webhook **não** marca como Conectado.
- **Mercado Pago / Asaas: Preparado — aguardando escolha e credenciais.**
  Nenhuma cobrança automática.
- **Assinatura eletrônica e Google Drive: Preparado — aguardando integração externa.**

## Setup local

```bash
npm install
cp .env.example .env.local   # preencha com os dados do SEU projeto Supabase
npm run dev                  # http://localhost:3000
npm run build
```

## Banco de dados (Supabase) — obrigatório para uso real

**Persistência ligada:** quando `DATABASE_URL` está configurada, **todas** as
rotas de API (`auth`, `overview`, `planner`, `clients`, `finance`,
`whatsapp`, `team`, `production`, `contracts`, `reports`, `release`, `seed`)
leem e escrevem no Postgres via Drizzle (`lib/repo.ts`). A tela mostra o
selo **“Banco Postgres”** e `GET /api/overview` devolve `"mode": "postgres"`.
Sem `DATABASE_URL`, o app funciona em **modo demonstração com dados em
memória** (seed com 3 clientes, 3 compromissos e 1 orçamento aprovado) e os
dados **não persistem** entre reinícios/instâncias da Vercel — a tela mostra
“Sem banco — dados em memória” e o overview devolve `"mode": "memoria"` com
um `demoWarning`.

Como a persistência funciona: cada escrita carrega o conjunto de dados do
banco, aplica a mesma regra de negócio de antes e regrava as tabelas dentro
de uma transação (`lib/repo.ts` — `loadOverview`/`saveOverview`). O conjunto
é pequeno (um estúdio, 4 usuários), então isso é rápido e seguro; a única
ressalva é que duas escritas exatamente simultâneas podem se sobrescrever
— na prática, com 4 pessoas, não é um problema.

### Passo a passo no Supabase (criar as tabelas)

1. No Supabase, abra o projeto `studio-manager` (região São Paulo, se
   disponível) e copie a **senha do banco** (definida na criação do projeto).
2. No menu lateral, clique em **SQL Editor → New query**.
3. Abra o arquivo `drizzle/0001_init.sql` deste projeto, copie **todo** o
   conteúdo, cole na query e clique em **Run**. Ele cria as 28 tabelas e os
   índices (`CREATE TABLE IF NOT EXISTS` — rodar 2 vezes não duplica nada).
4. Ainda no Supabase, vá em **Settings → Database → Connection string**,
   escolha **URI** (porta **5432**, conexão direta) e copie a string. Ela é
   algo como `postgres://postgres.SUA-REF:SUA-SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`
   — troque `[YOUR-PASSWORD]` pela senha do banco. **Essa string é secreta:
   nunca commite, nunca mande no chat.**
5. Rode o seed (cria os dados iniciais — idempotente, 2ª vez não duplica):
   ```bash
   DATABASE_URL="postgres://..." npm run db:seed
   ```
   Ou, depois do deploy, com o app no ar: `POST /api/seed` (ex.: pelo
   navegador, com `curl -X POST https://seu-app.vercel.app/api/seed`).
   O seed insere: 4 perfis (senha inicial `studio123`, hash scrypt),
   3 clientes, 3 compromissos, 1 orçamento aprovado com 3 parcelas,
   catálogo com 13 categorias e 13 modelos de contrato, além dos 17 itens
   do checklist e dos passos de publicação.
6. Configure as variáveis de ambiente (abaixo) no `.env.local` e na Vercel.
   Se o app responder `503` com “tabelas ainda não existem”, é o passo 3
   que falta; se responder `permission denied`, a connection string está
   com usuário/senha errados.

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | Onde pegar | Obrigatória? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | Sim (banco/auth) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (só no servidor!) | Sim, para operações de servidor |
| `DATABASE_URL` | Supabase → Settings → Database → Connection string (URI, porta 5432) | Sim, para o Drizzle/Postgres |
| `SESSION_SECRET` | Gere um valor longo e aleatório | Sim em produção |

**Nunca** commite `.env.local` nem nenhuma chave real. O `.gitignore` já
bloqueia `.env*`. Não mande senhas ou chaves no chat.

## Deploy na Vercel (grátis, plano Hobby)

1. Envie este projeto para o GitHub:
   ```bash
   git init && git add . && git commit -m "Studio Manager — versão para hospedagem"
   git branch -M main
   git remote add origin https://github.com/joelsonaredesf1/studio-manager.git
   git push -u origin main
   ```
2. Na Vercel: **Add New → Project → Import** o repositório `studio-manager`.
   Framework: Next.js (detectado automaticamente).
3. Em **Environment Variables**, cole as 5 variáveis da tabela acima.
4. **Deploy.** O endereço será algo como `studio-manager.vercel.app`
   (grátis, com HTTPS). Domínio próprio é opcional e pago à parte.
5. Entre com `Administrador` / `studio123`, troque a senha, edite os nomes
   provisórios dos funcionários em Funcionários e teste o fluxo completo
   com um cliente real antes de liberar para a equipe.

> Atenção ao plano Hobby da Vercel: é gratuito, mas destinado a uso pessoal
> não comercial. Para uso comercial contínuo do estúdio, avalie o plano Pro
> (US$ 20/mês) quando o movimento crescer. O plano gratuito do Supabase
> pausa o projeto após 1 semana sem uso — basta reativar no painel.

## Novidades — 11/11/2026 (pedido do dono após os primeiros testes)

- **Relatório completo por tipo de serviço** (Contratos e Relatórios): os 13 tipos com trabalhos aprovados, orçamentos, taxa de aceitação, contratado, recebido, a receber, vencido, ticket médio e participação — com destaque para o tipo de maior renda e o de maior aceitação. Valores rateados por item quando o orçamento tem mais de um serviço. Botões para imprimir/salvar em PDF e baixar o relatório completo em CSV.
- **Compromisso sem título:** o Planner não pede mais título — o compromisso usa o nome do serviço como título.
- **Conflito de horário:** só o Administrador pode marcar mais de um evento no mesmo dia e horário (com confirmação). Os demais perfis são bloqueados, na tela e na API.
- **Orçamento com vários serviços:** dá para marcar mais de um serviço por orçamento (checkbox); o total é a soma dos serviços menos o desconto. Ao aprovar, o agendamento, as parcelas e o Kanban trazem todos os serviços.
- **Contrato em PDF:** cada contrato tem o botão "PDF (imprimir / baixar)"; ao marcar como assinado, o PDF abre automaticamente para imprimir ou salvar.

## Pendente / faltando (não está pronto — não inventar que está)

- **Migração dos dados reais** do app original (clientes, orçamentos,
  financeiro) — exportar do app do Muse e importar no Supabase.
- **Edição de compromissos/tarefas/clientes** na interface (criar/excluir
  existem; editar ainda não), edição de modelos de contrato na tela,
  upload de arquivos de documentos, PWA/instalação, e as integrações
  externas listadas acima.
- **Autenticação robusta:** o login atual é por nome de perfil + senha com
  hash, sem sessão persistente em cookie/JWT nem proteção de rotas por
  perfil no servidor. Para produção, trocar por Supabase Auth ou NextAuth
  com as permissões por perfil já definidas em `lib/constants.ts`.
- A leitura inteligente do WhatsApp é simplificada (palavra-chave + data
  dd/mm); a original fazia análise mais completa da mensagem.
- A persistência usa regravação total por escrita (ver seção do banco):
  funciona e foi testada com Postgres real (seed, login, troca de senha,
  cliente, aprovação de orçamento, baixa, WhatsApp, Kanban, contrato
  assinado e checklist — tudo persistido após reiniciar o servidor), mas
  duas escritas simultâneas podem se sobrescrever; para escalar, trocar por
  escritas por tabela.
- O teste simultâneo (`run-simultaneous-test`) grava o resultado na tabela
  `sim_tests` só quando há Postgres; em modo demonstração o resultado é só
  devolvido na resposta.
- Os 13.424 linhas do `App.tsx` original não foram portadas linha a linha:
  esta é uma reimplementação funcional dos mesmos módulos e regras, com
  seed de exemplo. Conferir cada tela com o original antes de usar com
  clientes reais.
