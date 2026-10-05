# Mapa de interações NEXO

Atualizado em 04/10/2026. Evidência automatizada em `tests/e2e`, `tests/database` e `tests/unit`. Validação em produção será registrada em VALIDATION.md; implementação não equivale a teste integral.

| Área                | Ação e persistência                                                                     | Validação existente                                                            |
| ------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Entrada             | Login, formulário inválido, proteção de rotas, sair                                     | E2E com contas QA; e-mail real pendente                                        |
| Onboarding          | Nome, objetivo, matérias, nível, meta                                                   | E2E persiste, recarrega e bloqueia repetição                                   |
| Diagnóstico         | 15 respostas, feedback e resultado                                                      | E2E completo                                                                   |
| Hoje                | Retomar sessão não expirada; iniciar treino; caminhos aprender/revisar/explorar         | Navegação e 10 viewports                                                       |
| Questão             | Seleção, envio, feedback, próximo, relato                                               | Treino completo; idempotência e IDOR no banco; relato requer teste adicional   |
| Simulado            | Quantidade/tempo, limite por plano, resposta sem gabarito imediato, resultado e revisão | E2E completo                                                                   |
| Aprender            | Explicação, exemplo, resposta numérica/textual/verdadeiro-falso, confiança              | E2E microatividade; banco correção/idempotência                                |
| Notificações        | Badge, filtros, marcar uma/todas, dispensar, deep link, preferências                    | E2E página/preferências; unidade badge; banco autoria                          |
| Anotações           | Criar, listar após refresh, excluir com confirmação                                     | E2E criação/isola A/B; banco CRUD                                              |
| Flashcards          | Criar, virar, lembrei/não lembrei, reagendamento, excluir                               | E2E criação/revisão; banco idempotência/IDOR                                   |
| Caderno             | Filtrar, classificar erro, resolver, revisar, abrir tutor contextual                    | E2E página; fluxo completo de classificação pendente                           |
| Mapa/SOS/Busca      | Consultar dados de matérias/domínio, iniciar prática, buscar lições                     | E2E navegação; cobertura detalhada pendente                                    |
| Perfil              | Histórico, progresso, conquistas, exportação, preferências, configurações               | E2E exportação e navegação                                                     |
| Conta               | Exclusão exige EXCLUIR; dados vinculados em cascade                                     | Implementado; E2E destrutivo ainda pendente                                    |
| Tutor               | Contexto protegido, mensagem limitada, timeout, fallback configurável                   | Testes de router; E2E indisponibilidade honesta; provedor real pendente        |
| Admin conteúdo      | Pesquisar, editar, publicar, importar JSON/CSV, catálogo                                | E2E acesso/importação inválida; validações unitárias; edição completa pendente |
| Admin financeiro    | Consultar custos, registrar valor manual confirmado                                     | Banco RBAC e registro; E2E leitura; sem cobrança real                          |
| Admin relatos/saúde | Encaminhar relatos, consultar indicadores e auditoria                                   | RBAC no banco; E2E saúde; relato pendente                                      |
| PWA/offline         | Manifest/ícones, fallback offline, aviso de conexão                                     | Implementado; teste offline real pendente                                      |
| Documentos          | Termos, privacidade, cookies, uso aceitável                                             | E2E navegação; textos provisórios, sem revisão jurídica                        |

Não há checkout, upload, OAuth ou push apresentado como ativo. Nenhuma resposta de IA é fabricada quando faltam credenciais. Dados de teste e credenciais ficam fora do Git.
