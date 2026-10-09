# Exclusão de conta — estado em 09/10/2026

O SQL remoto delete_account continua na versão anterior, por instrução explícita. A solicitação destrutiva anterior foi retirada. Nenhuma nova migration de exclusão foi aplicada. O bloqueio da interface local NÃO protege chamadas diretas à RPC antiga.

Interface local: Configurações → Dados → Zona de risco → aviso → reautenticação oficial Supabase → confirmação explícita. A ação final permanece indisponível até aprovação separada da nova proteção no banco. Cancelar desmonta a etapa e descarta seu estado. Administradores recebem orientação de transferência de responsabilidades; não há backdoor de exclusão.

Senha usa signInWithPassword, identidade obtida no servidor e claims verificados. Senha não vai para SQL, logs ou armazenamento. MFA exige novo challengeAndVerify TOTP e AMR recente com aal2. A política unitária rejeita login antigo, token expirado, identidade divergente e fator antigo. Isso não equivale a teste real de revogação nem E2E completo de MFA.

E2E com conta QA e Auth real passou em desenvolvimento e build de produção local: senha incorreta recusada, senha correta confirmada, campo de senha limpo, confirmação final desabilitada, cancelar descarta a prova e a conta permanece ativa. O relógio da estação apresentou atraso de aproximadamente 137 segundos em relação ao Auth; a prova de interface usa o iat assinado da resposta recém-verificada, exclusivamente após signInWithPassword. Isso não substitui o futuro gate de banco usando now() e auth.sessions. Nenhuma exclusão real foi executada.

OAuth/OTP/magic link sem fluxo de reautenticação validado exibem indisponibilidade segura. Não se pede senha a uma sessão identificada somente como OAuth. Integração real com provedor e callbacks ainda pendente. O AMR identifica o método da sessão, não prova ausência de senha na conta: contas com métodos vinculados precisam de descoberta adicional antes de liberar todos os caminhos.

## Impacto das cascatas atuais

Excluídos ao executar efetivamente a exclusão: profiles (incluindo XP/streak), user_subjects, subscriptions, learning_sessions, question_attempts, topic_mastery, review_queue, usage_counters, user_achievements, ai_threads, ai_messages, ai_usage, notes, flashcards, notification_preferences, notifications, error_annotations, question_reports, activity_attempts, study_plan_items, learning_reflections e private.admins. Conta Auth, identidades, sessões, refresh tokens, tokens únicos, fatores/desafios/recovery MFA, autorizações/consentimentos OAuth e credenciais/desafios WebAuthn acompanham a cascata.

Referências removidas por SET NULL: private.audit_logs.actor, private.cost_entries.created_by e auth.scim_users.user_id. Isso não garante anonimização completa: entity_id e vínculos indiretos nos registros preservados exigem análise de retenção. learning_sessions.review_source também usa SET NULL.

Preservados: catálogos, questões, aulas, gabaritos, atividades, planos e conquistas compartilhados. private.billing_events mantém id, payload_hash, processed_at; sem coluna direta de usuário, mas identificadores externos podem permitir associação. Logs de auditoria e custos permanecem com ator nulo.

## Aprovação e recuperação

Antes de propor SQL: concluir testes de fluxo, sessões revogadas, JWT antigo, MFA, métodos suportados, A/B, repetição e falhas de rede. Apresentar SQL integral e impacto para aprovação explícita. Não executar exclusão real de usuários existentes para testar.

Rollback da definição de uma função não recupera uma conta excluída. Antes de qualquer teste destrutivo autorizado, usar conta descartável e backup/restauração verificados do escopo necessário, com armazenamento protegido. Não foi criado nem validado backup nesta etapa. Uma resposta de rede ambígua não permite afirmar “nenhum dado foi removido”; consultar resultado de modo seguro antes de confirmar sucesso ou repetição.
