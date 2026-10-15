# NEXO - Validacao autenticada final, 14/10/2026

Supabase ACTIVE_HEALTHY. 8/8 E2E autenticados em producao (4 por alias): login, sessao, reautenticacao, ajuda contextual em 390/1440px, isolamento e bloqueio de origem externa. Aliases: https://nexoteensina.vercel.app e https://nexo-six-beta.vercel.app.

O teste de planos agora aguarda o termino do streaming. Nenhum codigo do aplicativo ou migration foi alterado. Lint e typecheck passaram novamente. Os resultados anteriores de 67 testes unitarios/integracao e build continuam aplicaveis ao aplicativo inalterado.

Auditoria remota somente leitura: 42 consultas cruzadas em 21 tabelas sem dados de outra conta; 11 tabelas com fixtures nos dois lados, 10 com cobertura parcial/vazia. Todas as tabelas publicas tem RLS. As 40 funcoes publicas SECURITY DEFINER tem search_path vazio e nenhuma permite execucao por anon. Exclusao definitiva, reservas internas de IA e aplicacao de billing permanecem inacessiveis a authenticated. Contagem observada: 5 perfis e 230 tentativas. Migrations confirmadas ate 20261010180146.

Security Advisors: nenhum ERROR; 33 avisos de RPCs SECURITY DEFINER intencionalmente autenticadas, 1 aviso de protecao contra senhas vazadas desativada e 3 INFO de tabelas privadas com RLS sem policies (negacao por padrao). A RPC has_plan_feature usa auth.uid() e plano consultado no servidor; generate_study_plan restringe leituras e insercoes ao usuario autenticado.

Performance Advisors: 41 INFO de indices sem uso registrado, nenhum WARN/ERROR. Nenhum indice removido. Logs de runtime Vercel continuam limitados pela permissao da integracao; os E2E reais comprovam os fluxos testados, nao ausencia global de erros.

Pronto para uso/testes reais do nucleo. Lancamento publico com entrega de emails e venda de planos depende de configurar e validar SMTP e Stripe. Groq real continua opcional e desativado sem credenciais. Ver HANDOFF.md e docs/EXTERNAL_SERVICES.md para variaveis e configuracoes. Exclusao definitiva continua desativada e exige aprovacao futura. FIO nao foi acessado nem alterado.
