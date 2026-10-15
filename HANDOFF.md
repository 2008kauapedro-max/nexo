# NEXO — continuidade no VS Code

## Estado
Beta controlado dos estudos, com ajuda pedagógica salva nas 42 questões e IA contextual opcional. Chat geral removido. Exclusão de conta bloqueada no banco; reautenticação segura implementada, ativação destrutiva pendente. Veja [auditoria final](docs/FINAL_HARDENING.md) e [serviços externos](docs/EXTERNAL_SERVICES.md).

## Instalar e executar (PowerShell, Node.js 24+)
GitHub é a fonte oficial. Prefira clonar para manter histórico e facilitar push:
```powershell
git clone https://github.com/2008kauapedro-max/nexo.git
cd nexo
npm ci
Copy-Item .env.example .env.local
code .
```
Preencha `.env.local` exclusivamente com configuração NEXO. Em uma cópia existente: `git pull --ff-only` e `npm ci`; não sobrescreva seu `.env.local`.
```powershell
npm run dev
```
Abra http://localhost:3000.

## Testes
```powershell
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```
E2E autenticados exigem contas QA isoladas em `.local/qa-users.json` (array de objetos com `id`, `email`, `password`: aluno A, aluno B, admin). Esse arquivo é secreto, ignorado e não está no ZIP. Não use contas pessoais. Sem ele, testes autenticados são pulados. Não rode scripts de seed/reset no projeto remoto existente.

## Ambiente e credenciais
Obrigatórias: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Copie os nomes e valores vazios de `.env.example`. Local: APP_URL `http://localhost:3000`.

Ainda faltam: `GROQ_API_KEY` e `SUPABASE_SECRET_KEY` (NEXO, somente servidor); opcional `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (secret do CAPTCHA no painel Auth); SMTP próprio no Supabase (host, porta, usuário, senha, remetente e DNS). A integração Stripe já existe no código e requer `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PREMIUM_MONTHLY_PRICE_ID` e a mesma `SUPABASE_SECRET_KEY`. Os antigos `BILLING_PROVIDER`/`BILLING_WEBHOOK_SECRET` não ativam essa integração. Não usar AI_MODEL/AI_BASE_URL: modelo único `openai/gpt-oss-20b` já definido.

## Pendências reais
SMTP e entrega de emails; Groq real; CAPTCHA; proteção contra senhas vazadas; aprovação, backup/restauração e teste descartável antes de habilitar exclusão definitiva. OAuth de reautenticação apenas se um provedor for ativado futuramente. Stripe aguarda credenciais, preços, webhook e validação real antes de vender planos. Não aplicar `docs/pending-sql/*` automaticamente.

Se o Supabase estiver INACTIVE/pausado, use Resume project no projeto NEXO existente; não recrie o banco nem rode reset. Em 14/10 a auditoria encontrou essa condição e solicitou a retomada sem alterações de schema/dados. O plano gratuito pode sofrer pausas; monitore o estado antes de diagnosticar falhas de login como defeito do aplicativo.

## Deploy e Git
Somente `2008kauapedro-max/nexo`, branch `main`, projeto Vercel `nexo`. Push dispara deploy Git; conferir READY e smoke tests antes de considerar entregue.
```powershell
git status
git diff
git add .
git diff --cached
git commit -m "Descrição da alteração"
git push origin main
```
Não versionar `.env`, segredos, `.local`, node_modules ou builds. Nunca usar projetos Supabase/Vercel FIO. Supabase NEXO: `jseljonjvpkurvhwqsjh`.

Produção: https://nexoteensina.vercel.app e https://nexo-six-beta.vercel.app.

## Último commit entregue
A versão entregue é o HEAD desta cópia: `git log -1 --format="%H %s"`. O SHA exato consta também do relatório da entrega e de `REVISION.txt` dentro do ZIP. O ZIP contém os arquivos versionados, sem `.git` e sem credenciais; para continuar fazendo commits/push, prefira o clone oficial acima.
