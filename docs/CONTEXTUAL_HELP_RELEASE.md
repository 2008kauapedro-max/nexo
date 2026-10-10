# NEXO — ajuda contextual, 10 de outubro de 2026

## Escopo entregue

Navegação sem chat geral; `/ia` redireciona para estudo ou para a questão indicada. Ajuda abre junto da questão, com dica e conceito antes da tentativa, solução e explicações das alternativas depois. Simulado ativo bloqueia ajuda também no banco. As 42 questões originais receberam conteúdo salvo por inserção idempotente, sem sobrescrever edição existente. Cinco perfis e 196 tentativas estavam presentes antes e depois do seed; testes E2E posteriores acrescentam tentativas QA, nunca removem as existentes.

Groq é opcional: modelo único `openai/gpt-oss-20b`, sem ferramentas, pesquisa ou execução de código. Dicas e explicações salvas não consomem cota. O provider recebe só contexto educacional autorizado. Reserva, concorrência, deduplicação e limite por minuto são decididos no servidor/banco. Free/Pro/Premium: 5/20/50 ajudas por período diário. Falha libera a reserva; reservas abandonadas expiram. Preços de referência R$ 0 / R$ 24,90 / R$ 44,90, sem venda ou cobrança ativa.

Catálogos da ajuda e planos estão completos nos dez idiomas de interface. O conteúdo educacional permanece em português. Isso não declara todo o produto traduzido: ainda existem telas administrativas e fluxos internos com texto fixo.

## Correção incremental do calendário

`20261010113954_contextual_quota_calendar_reset.sql` substitui apenas a definição da RPC `reserve_contextual_help`. A comparação passa de `boundary < now() + 20 hours` para `boundary < per.ends_at + 20 hours`: voltar ao app à tarde não pode empurrar a próxima renovação para o dia seguinte ao esperado. Alterar o fuso ainda não reinicia um período ativo.

Aplicação não executa a função nem altera linhas, tabelas, policies, colunas, usuários, XP, tentativas ou assinaturas. Não contém DROP, DELETE, TRUNCATE ou UPDATE global. O UPDATE dentro do corpo continua restrito às reservas expiradas do usuário validado. Assinatura, privilégios service_role, bloqueio por usuário e idempotência foram preservados. A função antiga não é removida antes da substituição. Migration anterior permanece imutável. Testes reaplicam a correção para conferir idempotência.

Não há reversão de dados a realizar. Se for necessário recuar, manter as tabelas e dados, voltar a versão da aplicação e preparar uma nova migration revisada com a definição anterior da função; nunca apagar histórico nem editar migration aplicada. A correção é compatível com a versão anterior da aplicação.

## Origem e segurança

Os endpoints de ajuda comparam Origin com Host recebido, exigem HTTPS para hosts externos e ignoram x-forwarded-host fornecido pelo cliente. HTTP é permitido só em loopback. Isso suporta o servidor local e ambos os aliases do NEXO sem aceitar origem externa. Autenticação, participação na sessão e estado da tentativa são verificados novamente no banco.

Advisors: 33 avisos de RPCs SECURITY DEFINER executáveis por authenticated precisam ser interpretados pelas verificações internas de autorização; não representam liberação anônima. Reserva/finalização da IA são exclusivas de service_role. Três tabelas privadas têm RLS sem policies e sem grants: negação por padrão intencional. Performance apontou 25 índices ainda sem uso observado; não foram removidos por ausência de histórico suficiente. Proteção contra senhas vazadas permanece pendente do plano Supabase compatível.

Links: [RPCs privilegiadas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [RLS sem policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [índices não usados](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index), [senhas vazadas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Pendências de lançamento público

## Evidência local desta versão

- Lint e typecheck aprovados; build de produção concluiu as 50 páginas estáticas/pré-renderizadas e rotas dinâmicas previstas.
- 58 testes em 15 arquivos aprovados, incluindo 22 cenários de banco isolado, cotas 5/20/50, falha/refund, isolamento, origem e dez catálogos.
- 31 E2E aprovados em uma rodada de 32: ajuda em 390/1440 px, dez larguras de 360 a 1920 px, estudo completo, feedback, resultados, exportação, idioma, edição, admin, notas, flashcards, preferências e reautenticação não destrutiva.
- Um E2E de novo simulado foi pulado porque a cota semanal QA estava consumida. O bloqueio foi verificado; não se zerou histórico nem se concedeu plano artificial para passar no teste. Não declarar uma nova conclusão de simulado remoto nessa rodada.
- Auditoria de segredos: 234 arquivos e 443 blobs históricos sem achados pelo scanner de padrões. Dependências de runtime: zero vulnerabilidades reportadas por npm audit.

## Pendências de lançamento público

- `GROQ_API_KEY` e `SUPABASE_SECRET_KEY` exclusivamente NEXO ainda precisam ser provisionadas no servidor Vercel. Nenhuma resposta de IA real foi validada. Quotas/provider são testados isoladamente; PGlite serializa chamadas e não equivale a teste de carga concorrente em Postgres remoto.
- SMTP próprio, domínio/remetente e entrega real de confirmação/recuperação continuam pendentes. Não desativar confirmação para contornar isso.
- Billing comercial e recursos avançados anunciados como em preparação não estão liberados para venda. O catálogo de recursos não é prova de implementação nem de controle pago completo.
- `delete_account` legado não foi alterado. A interface final permanece bloqueada; isso não elimina a necessidade de corrigir a RPC remota antes da liberação pública, após validação completa e aprovação conforme `ACCOUNT_DELETION.md`.
- CAPTCHA depende de configuração externa; nenhuma proteção anti-bot é alegada sem ativação real.
