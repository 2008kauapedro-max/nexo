# Fechamento de segurança — NEXO, 10/10/2026

## Contenção aplicada

Migration incremental `20261010170456_account_reauthentication_guard.sql`, aplicada somente a `jseljonjvpkurvhwqsjh`. Não executa DROP, DELETE, TRUNCATE nem UPDATE de dados. Nenhuma tabela, policy ou coluna removida. Reexecução idempotente verificada. Antes/depois: 5 perfis, 209 tentativas, 42 pedagogias; novos testes de estudo podem acrescentar tentativas.

- `delete_account()` antiga: EXECUTE revogado de PUBLIC, anon, authenticated e service_role. A definição é preservada, mas clientes não a podem executar. UI continua bloqueada.
- `reserve_ai()` de chat geral: mesma revogação; não há mais consumidor no aplicativo. Evita reserva fora do fluxo contextual. Cotas contextuais e seus grants não mudaram.
- `private.assert_account_reauthentication()`: somente execução interna pelo proprietário. `public.account_deletion_readiness()` expõe apenas resultado de autorização do próprio usuário, sem parâmetros de identidade e sem alterar dados.
- Server Action agora confirma a sessão viva no banco após senha/TOTP, usando relógio do banco. Ver [ACCOUNT_DELETION.md](ACCOUNT_DELETION.md).

## Revisão SECURITY DEFINER

Revisadas as 37 funções públicas SECURITY DEFINER existentes antes desta migration. Todas tinham `search_path=''`, proprietário postgres e acesso anon negado. Não alterar proprietário sem redesenhar privilégios do Auth/esquema privado. As quatro funções exclusivas de servidor são `apply_billing_event`, `finish_ai` (legada), `reserve_contextual_help` e `finish_contextual_help`; avaliadas pelos grants reais, não pelo simples aparecimento no advisor.

Administração: `admin_catalog`, `admin_quality`, `admin_questions`, `admin_questions_page`, `admin_reports`, `admin_resolve_report`, `admin_save_pedagogy`, `admin_upsert_question`, `admin_upsert_learning_question` usam verificação de papel editorial; `admin_finance`, `admin_record_cost`, `admin_configure_plan`, `admin_tutor_metrics` exigem SUPER_ADMIN/FINANCE_ADMIN; `admin_health` exige SUPER_ADMIN. `admin_role`/`is_admin` consultam somente o papel de `auth.uid()`, sem confiar em user_metadata.

Autoria e conteúdo: `activity_feedback`, `ai_context`, `generate_study_plan`, `next_question`, `question_help`, `report_question`, `review_flashcard`, `review_session`, `save_preferences`, `session_feedback`, `session_question_view`, `start_session`, `submit_activity`, `submit_answer`, `sync_notifications` vinculam leitura/escrita ao chamador e/ou sessão dele. Gabaritos são protegidos antes da resposta e durante simulado ativo. Planos e limites vêm do banco. `apply_billing_event`, `reserve_contextual_help`, `finish_contextual_help` permanecem exclusivamente no servidor; nenhum grant a usuários comuns.

Correções reais desta rodada: revogar as duas RPCs legadas e incluir gate de reautenticação vivo. As demais funções legitimamente expostas continuam gerando aviso de SECURITY DEFINER; não substituir por acesso direto a tabelas sensíveis para zerar o advisor. RLS sem policies em três tabelas privadas é bloqueio intencional, com grants públicos revogados.

## Evidência

- Lint/typecheck aprovados; 67 testes unitários/integração, incluindo 31 de banco.
- Build de produção aprovado (Next.js 16.3.8, 50 páginas geradas e rotas dinâmicas).
- Nove novos testes de banco: sessão recente/antiga/revogada/expirada, identidade A/B, MFA, admin/conta bloqueada, métodos não habilitados, grants, idempotência e SQL de exclusão em memória.
- Auth real: sessão recente aceita; após cinco minutos, negada; nova senha aceita; logout local da sessão de auditoria invalida o gate mesmo antes de expirar JWT. Nenhuma conta excluída.
- Navegador MFA real: TOTP incorreto negado, correto aceito pelo gate de banco, campos sensíveis limpos e botão final bloqueado; fator temporário removido.
- E2E completo: 35 aprovados, 1 pulado (nova conclusão de simulado indisponível pela cota semanal QA já consumida). Não resetamos progresso nem burlamos plano. Inclui MFA real, dez larguras, inspeção visual ampliada, dez idiomas, notas/flashcards, admin e notificações com 0/1/2/9/99/100 itens.
- Auditoria de segredos: 239 arquivos rastreados e 509 blobs históricos, nenhum achado pelo scanner de padrões. Isso não é garantia universal de ausência de segredos.
- No servidor de desenvolvimento, navegações rápidas produziram cancelamentos `destination stream closed early`/ECONNRESET; os fluxos e persistência passaram. Não confundir esses cancelamentos locais com erros observados em produção.

## Advisors após a migration

Security: 32 avisos de SECURITY DEFINER autenticado (antes 33: duas RPCs legadas removidas da exposição, uma probe protegida adicionada), 3 informativos de RLS privado sem policy e 1 aviso de senhas vazadas desabilitadas. Não há alerta ERROR. Performance: nenhum WARN/ERROR; 25 informativos de índices sem uso, preservados. Remediações oficiais estão nos links ao final. A proteção de senhas vazadas depende de plano/configuração compatível; nenhum upgrade foi feito.

## Publicação

O push de `main` publica exclusivamente no projeto Vercel NEXO `prj_XHclFqaz6goZrIasKoKgwZvnPO42`. Confirmar deployment READY correspondente ao SHA de `git rev-parse HEAD`, aliases `nexoteensina.vercel.app` e `nexo-six-beta.vercel.app`. Smoke pós-deploy: `E2E_BASE_URL` em cada alias, arquivos `account-security.spec.ts`, `account-mfa.spec.ts`, `contextual-help.spec.ts`. Os testes usam somente QA e não excluem contas; não executar o SQL pendente. A integração de logs tem limitação de permissão registrada; o painel consultado na auditoria anterior não apresentava erros na janela observada, o que não equivale a observação contínua.

## Limites de lançamento

Beta controlado com contas existentes: estudo e ajuda salva utilizáveis sem Groq. Público irrestrito depende de SMTP/entrega real, configuração antiabuso, proteção contra senhas vazadas e decisão sobre exclusão definitiva. A vulnerabilidade de chamada direta antiga foi contida; a funcionalidade de exclusão não está concluída/ativada.

SQL destrutivo proposto permanece fora das migrations em `docs/pending-sql/enable_account_deletion.sql`. Requer aprovação, backup/restauração verificados e teste remoto descartável. OAuth não está ativo no produto; OTP/OAuth para reautenticação não estão habilitados. Billing real é decisão futura. Groq precisa de `GROQ_API_KEY` e `SUPABASE_SECRET_KEY`, conforme [EXTERNAL_SERVICES.md](EXTERNAL_SERVICES.md).

Referências: [SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [RLS privado sem policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [senhas vazadas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), [índices sem uso](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).
