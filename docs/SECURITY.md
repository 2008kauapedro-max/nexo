# Segurança do NEXO

## Fronteiras

Ativos: identidade, histórico educacional, gabaritos, papéis administrativos, limites e assinatura. Atores adversários considerados: visitante, aluno autenticado manipulando UUIDs/payloads e emissor de webhook falso.

| Ameaça                 | Controle                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| IDOR e leitura cruzada | RLS vinculada a `auth.uid()`; RPCs filtram proprietário; testado com duas identidades pela API remota               |
| Elevação de plano/XP   | Sem permissão direta de escrita; atualização transacional nas RPCs; plano efetivo depende do banco e validade       |
| Gabarito antecipado    | Tabela no schema privado; dica sem resposta antes da tentativa; feedback autorizado após resposta                   |
| Administrador forjado  | `private.admins`; checagem no servidor e dentro de cada RPC administrativa                                          |
| Replay de resposta     | UNIQUE sessão/questão; retorno idempotente sem repetir XP ou consumo                                                |
| Corrida de cotas       | Lock do perfil e contador no banco, na mesma transação                                                              |
| SQL injection          | SDK parametrizado; nomes de tabela em migrations são constantes, nunca payload                                      |
| XSS/clickjacking       | React escapa conteúdo; CSP com nonce; `frame-ancestors 'none'`; nenhum HTML de usuário renderizado                  |
| CSRF                   | Proteção de origem de Server Actions; origem explícita no tutor; cookie SameSite Lax                                |
| Open redirect          | Lista de formato de caminho interno; callback usa origem canônica configurada                                       |
| Abuso                  | Limites Auth do Supabase; até 30 sessões/hora; cota diária transacional e intervalo mínimo IA; validação de payload |
| Webhook falso          | HMAC com comparação constante, janela de 5 minutos, IDs únicos e hash de payload; acesso exclusivo servidor         |
| Eventos fora de ordem  | Assinatura atualizada somente por evento mais recente                                                               |
| Cache privado          | `private, no-store`; service worker armazena só a página pública de offline                                         |

## Privilégios

Todas as 30 tabelas públicas têm RLS e SELECT concedido explicitamente ao papel autenticado. As policies globais de leitura limitam-se aos catálogos compartilhados; dados pessoais sempre usam propriedade. Questões só podem ser lidas se publicadas. As seis tabelas privadas não concedem acesso a clientes e têm policies restritivas de negação.

Funções SECURITY DEFINER são usadas intencionalmente como operações transacionais estreitas, com `search_path=''`, verificação de identidade e de ownership/admin. EXECUTE foi revogado de PUBLIC e anon. O advisor alerta sobre essas funções expostas a authenticated; é uma superfície de API deliberada, não uma alegação de ausência de avisos. Cada nova função deve passar pelos mesmos testes. Funções de finalização IA e billing são exclusivas de `service_role`.

## Evidência

Testes automatizados em `tests/database/security.test.ts` e `scripts/security-live.mjs`. A execução remota confirmou que A e B só leem seus registros; operações indevidas de escrita são negadas; aluno não administra nem desbloqueia Pro; gabarito não aparece no contexto de dica anterior à resposta; repetir uma resposta não duplica XP.

Advisors de segurança e performance foram executados. Os índices compostos faltantes foram adicionados. Índices sem uso em banco recém-criado permanecem para cobertura de FKs e consultas previstas; estatística vazia não justifica remoção.

## Limites e lançamento

- A implementação de modo prova oculta feedback na interface, mas não representa um ambiente de avaliação antifraude: o aluno pode observar seu próprio progresso pela API.
- Rate limiting de login/cadastro/reset depende do Supabase Auth. Ativar CAPTCHA/SMTP e validar o IP confiável no deploy antes de escalar tráfego público.
- Não há política comercial definitiva, controlador legal/canal de privacidade ou consentimento de menores configurados. A página pública declara a implantação em andamento.
- OAuth, envio real de e-mail, recuperação por e-mail, IA real e gateway comercial dependem de configuração externa e não foram declarados validados.
- `npm audit --omit=dev` não encontrou vulnerabilidades. O lint depende transitivamente de `braces@3.0.3`, afetado por GHSA-vfj7-8cjw-p6xm; a versão consultada não tinha correção. Não use padrões de glob não confiáveis no lint. O pacote não vai para o runtime do aplicativo.
- Nunca registrar tokens, senhas ou payloads completos do tutor. Logs administrativos contêm ator, ação, entidade e timestamp.

Referências dos advisors: [SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [índices de FKs](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).

## Auditoria complementar de 04/10/2026

Histórico remoto e arquivos locais: nove migrations. Consulta aos catálogos confirmou RLS nas 30 tabelas públicas e nas seis privadas. Nenhuma função pública SECURITY DEFINER acessível a anon ou sem configuração explícita de search_path foi encontrada. Advisors: 25 avisos de RPCs autenticadas SECURITY DEFINER e um de senha vazada dependente de Pro; performance: 25 índices ainda sem uso, nível INFO. Sem upgrade ou alteração de custos.

Testes adicionais exercitam FINANCE_ADMIN sem conteúdo/saúde, isolamento de notas/cartões/reflexões/plano, plano Premium válido versus expirado e roles forjadas em claims. Instrumentação registra rota, método, categoria e digest, sem cookies, cabeçalhos ou texto do aluno. O hook padrão do framework pode registrar o erro original: não lançar segredos como mensagem de erro.
