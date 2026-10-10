# Exclusão de conta — atualização de 10/10/2026

A migration `20261010170456_account_reauthentication_guard.sql` foi aplicada somente no NEXO. Revogou EXECUTE de `delete_account` e da reserva de chat geral `reserve_ai` para PUBLIC, anon, authenticated e service_role, sem mudar suas definições e sem excluir linhas. A chamada direta antiga agora é recusada; a interface continua desabilitada. Contagem imediatamente antes/depois: 5 perfis, 209 tentativas, 42 pedagogias.

O novo gate privado verifica identidade, expiração JWT, sessão existente em `auth.sessions`, prazo `not_after`, conta não banida/excluída, ausência de papel administrativo e reautenticação por senha há no máximo cinco minutos. A prova precisa existir no AMR assinado e em `auth.mfa_amr_claims`; MFA exige aal2 e TOTP recente nas duas fontes. O servidor usa `account_deletion_readiness()` após senha/TOTP. Esta RPC é somente leitura e não aceita identidade fornecida pelo cliente. OAuth/OTP não são métodos habilitados para exclusão: não há login OAuth ativo no produto nem provedor/callback de reautenticação validado.

O SQL de exclusão proposto está em [pending-sql/enable_account_deletion.sql](pending-sql/enable_account_deletion.sql), **fora das migrations e NÃO aplicado**. Testado somente em banco descartável em memória: confirmação exata, reautenticação, revogação prévia, cascata de registro de teste, preservação de B e recusa de repetição. Isso não substitui backup/restauração e teste destrutivo remoto autorizado. Não liberar o botão nem conceder acesso à RPC antiga. Nenhum segredo de servidor é necessário para o gate de leitura.

## Histórico anterior à contenção (09/10/2026)

Antes da atualização acima, a RPC antiga continuava executável diretamente. A solicitação destrutiva anterior foi retirada. A contenção agora é no banco; não apenas na interface.

Interface local: Configurações → Dados → Zona de risco → aviso → reautenticação oficial Supabase → confirmação explícita. A ação final permanece indisponível até aprovação separada da nova proteção no banco. Cancelar desmonta a etapa e descarta seu estado. Administradores recebem orientação de transferência de responsabilidades; não há backdoor de exclusão.

Senha usa signInWithPassword, identidade obtida no servidor e claims verificados. Senha não vai para SQL, logs ou armazenamento. MFA exige novo challengeAndVerify TOTP e AMR recente com aal2. A política unitária rejeita login antigo, token expirado, identidade divergente e fator antigo. Isso não equivale a teste real de revogação nem E2E completo de MFA.

E2E com conta QA e Auth real passou em desenvolvimento e build de produção local: senha incorreta recusada, senha correta confirmada, campo de senha limpo, confirmação final desabilitada, cancelar descarta a prova e a conta permanece ativa. O relógio da estação apresentou atraso de aproximadamente 137 segundos em relação ao Auth; a prova de interface usa o iat assinado da resposta recém-verificada, exclusivamente após signInWithPassword. Isso não substitui o futuro gate de banco usando now() e auth.sessions. Nenhuma exclusão real foi executada.

MFA real via API validado em conta QA isolada: enrollment oficial, senha recente sem fator negada pela política, código incorreto negado pelo Auth e TOTP correto com aal2 aceito. Fator temporário removido e ausência de fatores residuais confirmada. Evidência: scripts/mfa-security-live.mjs e .local/evidence/mfa-security-live.json. Ainda faltam MFA pelo navegador, revogação no gate de banco e exclusão real autorizada; não interpretar este resultado como aprovação da migration.

OAuth/OTP/magic link sem fluxo de reautenticação validado exibem indisponibilidade segura. Não se pede senha a uma sessão identificada somente como OAuth. Integração real com provedor e callbacks ainda pendente. O AMR identifica o método da sessão, não prova ausência de senha na conta: contas com métodos vinculados precisam de descoberta adicional antes de liberar todos os caminhos.

## Impacto das cascatas atuais

Excluídos ao executar efetivamente a exclusão: profiles (incluindo XP/streak), user_subjects, subscriptions, learning_sessions, question_attempts, topic_mastery, review_queue, usage_counters, user_achievements, ai_threads, ai_messages, ai_usage, notes, flashcards, notification_preferences, notifications, error_annotations, question_reports, activity_attempts, study_plan_items, learning_reflections e private.admins. Conta Auth, identidades, sessões, refresh tokens, tokens únicos, fatores/desafios/recovery MFA, autorizações/consentimentos OAuth e credenciais/desafios WebAuthn acompanham a cascata.

Referências removidas por SET NULL: private.audit_logs.actor, private.cost_entries.created_by e auth.scim_users.user_id. Isso não garante anonimização completa: entity_id e vínculos indiretos nos registros preservados exigem análise de retenção. learning_sessions.review_source também usa SET NULL.

Preservados: catálogos, questões, aulas, gabaritos, atividades, planos e conquistas compartilhados. private.billing_events mantém id, payload_hash, processed_at; sem coluna direta de usuário, mas identificadores externos podem permitir associação. Logs de auditoria e custos permanecem com ator nulo.

## Aprovação e recuperação

Estratégia obrigatória para a etapa pendente: snapshot/backup Supabase do NEXO com retenção e ponto de restauração confirmado; ensaio de restauração em ambiente isolado incluindo Auth e registros dependentes; conta descartável autorizada e inventário das cascatas abaixo; confirmar contagens e isolamento antes/depois. Se falhar, desabilitar a nova RPC e o botão; restaurar dados apenas a partir do backup verificado, nunca reabrir a RPC antiga. O projeto ainda não tem ensaio de restauração validado. Uma migration de definição não apaga dados ao instalar, mas habilitar esta função permite exclusão definitiva ao invocá-la.

Antes de propor SQL: concluir testes de fluxo, sessões revogadas, JWT antigo, MFA, métodos suportados, A/B, repetição e falhas de rede. Apresentar SQL integral e impacto para aprovação explícita. Não executar exclusão real de usuários existentes para testar.

Rollback da definição de uma função não recupera uma conta excluída. Antes de qualquer teste destrutivo autorizado, usar conta descartável e backup/restauração verificados do escopo necessário, com armazenamento protegido. Não foi criado nem validado backup nesta etapa. Uma resposta de rede ambígua não permite afirmar “nenhum dado foi removido”; consultar resultado de modo seguro antes de confirmar sucesso ou repetição.
