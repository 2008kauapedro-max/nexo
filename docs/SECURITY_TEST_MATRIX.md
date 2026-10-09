# Matriz de segurança — NEXO

Checkpoint em andamento de 09/10/2026. “Bloqueado” descreve o ataque no teste indicado, não uma garantia geral. A migration isolada report_question_security_hardening foi aplicada e validada no NEXO. O pacote anterior foi retirado; delete_account remoto permanece inalterado. Controles novos da interface ainda não foram publicados.

| Ataque / superfície | Defesa | Evidência / estado |
| --- | --- | --- |
| Ler perfil/tentativas de B usando A | RLS por identidade | Testes de banco e `scripts/security-live.mjs`; nova execução remota completa pendente |
| CRUD de notas/cartões de B | RLS + grants de colunas | `tests/database/security.test.ts`, bloqueado no banco local |
| Editar XP via preferências/idioma | Grant apenas nas colunas de preferência | Teste de banco, bloqueado |
| Role/plan forjados em metadata | Papéis e assinatura em tabelas controladas pelo servidor | Teste de banco, bloqueado |
| FINANCE_ADMIN lendo conteúdo/saúde | Role verificada dentro da RPC | Teste de banco, bloqueado |
| Free usando simulado Pro | Plano efetivo calculado no banco | Teste de banco e auditoria remota anterior, bloqueado |
| Repetir resposta para ganhar XP | Transação, lock e UNIQUE sessão/questão | Teste de banco, idempotência validada |
| Ler gabarito antes da resposta | Schema privado e contexto restrito | Teste de banco e auditoria remota anterior, bloqueado |
| Trocar idioma para avançar questão | URL canônica e leitura da tentativa própria | E2E específico passou; seleção e feedback preservados em en/de/ja/zh |
| Tradução publicada sem revisão/origem | CHECK no banco | Teste de banco, bloqueado; identificação completa de revisor ainda pendente |
| Relatos simultâneos contornando 10/h | Lock do perfil antes da contagem | PASS remoto: com 1 vaga, 10 pedidos aceitaram exatamente 1. Duplicação, A/B, publicação e payload validados por scripts/report-security-live.mjs |
| Exclusão com JWT recém-renovado mas login antigo | Política local de AMR recente; gate de banco ainda pendente | 3 testes unitários de claims passaram. Não comprova revogação remota. A migration anterior NÃO foi aplicada e os testes dela não representam proteção atual |
| Open redirect e loop no callback | Destinos fechados: início ou redefinição | Teste unitário com URLs externas, codificadas e callback/admin arbitrários, bloqueado |
| Payload sem Content-Length | Leitura limitada por bytes reais | `tests/unit/request.test.ts`, bloqueado acima do teto |
| Resposta gigante/redirecionada do provedor IA | Teto de 64 KB na leitura; redirect error; schema 8.000 caracteres | Código implementado; teste com provedor real pendente |
| Prompt injection com ação administrativa | Router sem ferramentas/permissão administrativa; contexto sem secrets | Arquitetura revisada; comportamento textual de modelo real não validado |
| Webhook falso/repetido/antigo | HMAC constante, janela temporal, ID/hash no banco | Unitários/banco; contrato apenas desenvolvimento; billing indisponível em produção |
| Scripts inline / embedding | Nonce, strict-dynamic, frame-ancestors none | Teste da política passou; navegador de produção atualizado pendente |
| CAPTCHA falso | Token passado ao Supabase Auth para validação no servidor | Integração preparada; não ativa sem chave e configuração Auth reais |
| Upload / arquivo privado / Realtime cruzado | Funcionalidades não expostas | Consulta remota: nenhum bucket e nenhuma tabela na publicação Realtime; não equivale a testar uploads implementados |
| Vazamento de secrets | Scanner sem imprimir valores, Git ignorando env privado | `scripts/audit-secrets.mjs`; resultado registrado separadamente |
| MFA de administrador | Pendente | Não declarar MFA exigido/validado enquanto enrollment, recovery e gate de banco não estiverem implementados |

## Inventário de tabelas

Consulta direta ao catálogo remoto confirmou RLS em todas as 36 tabelas abaixo. Catálogos são compartilhados entre usuários autenticados; não se concedeu acesso anônimo geral. Nenhuma função privilegiada pública tem EXECUTE para anon. Todas as funções auditadas têm search_path explícito vazio.

| Classe | Tabelas |
| --- | --- |
| Catálogo compartilhado autenticado | subjects, topics, subtopics, plans, achievements, topic_prerequisites |
| Conteúdo publicado | questions, lessons, learning_activities |
| Privadas do usuário, leitura e mutações controladas | profiles, user_subjects, subscriptions, learning_sessions, question_attempts, topic_mastery, review_queue, usage_counters, user_achievements, ai_threads, ai_messages, ai_usage, notifications, question_reports, activity_attempts, study_plan_items |
| Privadas do usuário, CRUD restrito | notes, flashcards, notification_preferences, error_annotations, learning_reflections |
| Server-only, schema private | admins, question_answers, activity_keys, audit_logs, billing_events, cost_entries |

Faltam nesta rodada: matriz CRUD adversarial completa para cada tabela, concorrência remota de cota/XP, MFA, segurança de sessão pós-logout em todos os endpoints, revisão final de grants/constraints, testes de produção e segunda auditoria adversarial. Não substituir esses itens por leitura de policies.

Advisors consultados novamente em 09/10/2026 após migration 14: 28 avisos de RPC SECURITY DEFINER executável por authenticated, 1 aviso de proteção de senhas vazadas desativada; performance com 24 INFO de índices sem uso, sem WARN. Não revogar RPCs nem remover índices apenas para silenciar avisos: validar autorização de cada operação e uso representativo primeiro.
