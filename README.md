# NEXO

Aprenda no seu nível. Plataforma de estudos adaptativos em português, com identidade própria, interface mobile-first e persistência real no Supabase.

**Repositório único:** https://github.com/2008kauapedro-max/nexo · branch `main`.

## Estado da entrega

Implementados: landing, autenticação por e-mail, onboarding persistente, diagnóstico, treino adaptativo, feedback, XP, sequência, revisão espaçada, simulados, resultados, perfil, exportação/exclusão de conta, administração de conteúdo, importação JSON/CSV e PWA. O seed contém 42 questões autorais, distribuídas por sete matérias.

O tutor tem integração server-side e limites, mas requer credenciais para respostas reais. Planos existem no banco; checkout comercial ainda está desativado. Não existe integração de pagamento fingindo estar ativa. Consulte [VALIDATION.md](docs/VALIDATION.md) para evidência e limites.

## Stack e arquitetura

Next.js 16, React 19, TypeScript strict, Tailwind 4, Supabase Auth/PostgreSQL, Zod, Vitest/PGlite e Playwright. Versões exatas em `package.json` e lockfile versionado.

- `src/app`: páginas, Server Actions e Route Handlers.
- `src/components`: interações pequenas e componentes de apresentação.
- `src/domain`: algoritmo, validações, importação e contratos de billing.
- `src/lib`: fronteiras server-side, Supabase tipado e provedor de IA.
- `src/config`: branding; tokens visuais em `src/app/globals.css`.
- `supabase/migrations`: schema, RLS, RPCs transacionais e hardening.
- `tests`: domínio, banco real em WASM e navegação no navegador.

O banco decide autoria, plano, limites, pontuação e gabarito. As RPCs verificam `auth.uid()` e permissões. O navegador não escreve diretamente em progresso nem assinaturas.

## Executar

Requer Node.js 24+ e npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

No PowerShell, use `Copy-Item .env.example .env.local`. Preencha URL e chave pública do projeto NEXO. Nunca versione `.env.local` ou chaves privadas.

Abra http://localhost:3000. Sem Supabase configurado, os fluxos privados não estão disponíveis.

## Banco

O projeto remoto NEXO foi criado na região `sa-east-1`. A configuração local não acessa outros projetos.

Para um ambiente Supabase local com Docker:

```sh
npx supabase start
npx supabase db reset
```

Para preparar outro ambiente NEXO autorizado, revise o destino antes de conectar:

```sh
npx supabase link --project-ref SEU_PROJECT_REF_NEXO
npx supabase db push
```

Os seeds estão em `supabase/seed.sql` e `supabase/lessons-seed.sql`; ele é idempotente por fingerprint. `node scripts/seed.mjs` regenera as 42 questões autorais. Não substitui revisão pedagógica por especialistas. Migrations foram geradas pela CLI e aplicadas na ordem; nunca altere uma migration já aplicada, acrescente outra.

Gere os tipos após mudanças no schema usando `supabase gen types typescript`, apontando explicitamente para o projeto NEXO. O arquivo utilizado pelo aplicativo é `src/lib/database.types.ts`.

## Autenticação e administração

Configure Site URL e Redirect URLs no Supabase Auth para o domínio da implantação, incluindo `/auth/callback` e a recuperação de senha. Localmente, use `http://localhost:3000`. Configure SMTP próprio e proteção contra abuso antes do lançamento público. OAuth requer configuração do provedor e não é apresentado como opção ativa.

O papel administrativo está em `private.admins`, nunca em metadados editáveis do usuário. Um operador autorizado deve inserir o UUID do administrador nessa tabela via ambiente de administração do banco. Nenhum usuário de produção recebe esse papel por cadastro.

## Variáveis

| Variável                               | Uso                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                  | Origem canônica, callbacks, proteção de origem                                  |
| `NEXT_PUBLIC_SUPABASE_URL`             | Endpoint do NEXO                                                                |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave pública adequada ao cliente                                               |
| `SUPABASE_SECRET_KEY`                  | Somente servidor; finalização de uso IA e eventos de billing                    |
| `GROQ_API_KEY`                         | Credencial privada Groq; modelo fixo openai/gpt-oss-20b, somente ajuda contextual |
| `BILLING_PROVIDER`                     | `disabled` por padrão; contrato `signed-development` somente em desenvolvimento |
| `BILLING_WEBHOOK_SECRET`               | Assinatura HMAC do contrato de desenvolvimento                                  |

Não coloque nenhuma chave privada em variáveis `NEXT_PUBLIC_*`.

## Validação

```sh
npm run lint
npm run typecheck
npm run test
npx playwright install chromium
npm run test:e2e
npm run build
```

Os testes locais de banco criam dois usuários e verificam RLS, INSERT/UPDATE/DELETE indevidos, plano, gabarito e idempotência. Não precisam de rede nem Supabase remoto.

Os E2E autenticados usam contas de QA isoladas em `.local/qa-users.json`, nunca versionadas. `scripts/qa-users.mjs` prepara contas e SQL para **um ambiente NEXO de testes**; somente um operador deve aplicar o SQL nesse ambiente. `scripts/security-live.mjs` verifica o isolamento via API real. Não execute esses scripts sobre dados de usuários reais. O teste de onboarding requer a conta Alice com onboarding incompleto e cotas diárias de QA disponíveis. Sem as contas, os cenários autenticados são explicitamente ignorados; CI não deve ser confundida com validação integral do ambiente remoto.

## Build e deploy

```sh
npm run build
npm run start
```

Na Vercel, importe apenas `2008kauapedro-max/nexo`, selecione Next.js e configure as variáveis. Use uma implantação de preview, valide Auth/callbacks e só então promova para produção. O projeto NEXO já está publicado em https://nexo-six-beta.vercel.app, conectado ao repositório oficial. Consulte docs/VALIDATION.md para o deployment e os resultados efetivamente auditados.

Antes do lançamento: habilitar SMTP, definir domínio e identificação/canal do controlador de dados, revisar condições para menores, revisão pedagógica, habilitar monitoramento e configurar IA/pagamentos conforme contratação. Não declarar a versão como comercialmente pronta até essas etapas.

## Documentos

- [Interações e evidências](docs/INTERACTION_MAP.md)
- [Segurança e modelo de ameaças](docs/SECURITY.md)
- [Importação de conteúdo](docs/IMPORT.md)
- [Validação e pendências](docs/VALIDATION.md)

## Expansão do aprendizado

Plano semanal persistente, missões diárias, desafio curto, reflexão sobre lições, mapa com estimativa de retenção, anotações, flashcards, caderno de erros e notificações fazem parte do mesmo aplicativo. O admin usa abas e páginas próprias para conteúdo, fábrica determinística de rascunhos, qualidade, relatos, custos e saúde. A reflexão é autoavaliação, não correção por IA. Consulte docs/INTERACTION_MAP.md para a cobertura de cada fluxo.

As versões dos arquivos de migration foram alinhadas ao histórico atribuído pelo conector remoto, preservando o conteúdo SQL. Não reaplicar migrations com timestamps antigos. Os templates de email estão preparados no Supabase local; isso não valida envio remoto.

