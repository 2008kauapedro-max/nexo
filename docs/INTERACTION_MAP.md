# Mapa de interações NEXO

Atualizado em 05/10/2026. As evidências ficam em tests/e2e, tests/database, tests/unit e scripts/security-live.mjs. Resultados finais e implantação estão em VALIDATION.md. A cobertura não significa que todas as combinações de erro e dispositivo foram testadas.

| Área | Ação real | Evidência e limite |
|---|---|---|
| Entrada | Login, validação, callback seguro, sair | E2E com contas QA; cadastro/recuperação com entrega real dependem de SMTP |
| Onboarding/diagnóstico | Preferências, 15 respostas, resultado, bloquear repetição | Fluxo completo, persistência e refresh |
| Hoje/estudo | Iniciar, retomar, responder, avançar, resultado | E2E treino completo; retomada após refresh/navegação; 10 viewports |
| Simulados/desafios | Quantidade/tempo, restrição de plano, correção ao finalizar, revisão | E2E completo; relógio controlado no banco; não é sistema antifraude de prova oficial |
| Aprender | Lição, exemplo, numérico, texto, verdadeiro/falso, ordenação | Envio real, correção SQL, feedback privado restaurado após refresh; unidade/SQL contra IDOR |
| Confiança | Certeza/indecisão/chute alteram peso da evidência; alerta em erro confiante | SQL e UI; não é diagnóstico científico de falso domínio |
| Me prove que aprendeu | Explicação própria persistente e comparação com referência | E2E gravação e refresh; autoavaliação, sem IA ou nota inventada |
| Plano/missões | Sete dias persistentes, contadores baseados em eventos reais | E2E criação idempotente e refresh; missões sem XP artificial |
| Mapa/retenção | Abrir matéria, domínio estimado, sugestão gradual de revisão | Unidade da estimativa e navegação responsiva; heurística não validada cientificamente |
| Caderno | Filtrar, classificar, marcar entendido, revisão, tutor contextual | E2E reflexão persistente e simulado/revisão |
| Anotações | Criar, consultar, excluir | E2E A/B, SQL CRUD/ownership; sem upload de documentos |
| Flashcards | Criar, virar, lembrar/não lembrar, reagendar, excluir | E2E criação/revisão; SQL agenda e isolamento |
| Busca | Encontrar lições/assuntos e abrir destino | Navegação; catálogo inicial limitado, ainda não busca todos os materiais pessoais |
| Notificações | 0/1/2/9/99/100, 99+, leitura, dispensar, deep link, preferências | E2E com 100 registros exclusivos de QA; SQL dedupe/ownership. Eventos de segurança/assinatura externos não exercitados |
| Perfil/conta | Histórico, preferências, exportação, excluir conta | E2E exportação; SQL exclusão/cascade em identidade descartável. Exclusão real pela UI não exercitada |
| Tutor | Router compatível, fallback, contexto, cotas, timeout | Unidade com mocks identificados; API503 e UI desativada sem credenciais; provedor real pendente |
| Admin conteúdo | Abas, pesquisa, edição, importar JSON/CSV, catálogo, rascunhos | E2E edição persistente de rascunho, importação inválida, fábrica idempotente; validação/dedupe em unidade/banco |
| Admin relatos | Receber relato e registrar resolução | E2E aluno→admin→refresh com registro de QA |
| Admin qualidade/saúde | Acertos/amostra, relatos, conexão, auditoria | E2E consulta e autorização; não é observabilidade externa completa |
| Financeiro | Consulta e registro de custos conferidos | SQL FINANCE_ADMIN versus SUPER_ADMIN; E2E leitura restrita. Sem receita/MRR fabricados |
| Billing | Webhook assinado de desenvolvimento | Unidade HMAC, replay/colisão/ordem no banco; comercial desativado |
| PWA/offline | Manifest/ícones, página offline pública, aviso e retry | E2E perda/retorno da conexão; script de auditoria em produção. Sem fila offline de respostas nem cache de dados privados |
| Legal/configurações | Termos, privacidade, cookies, uso aceitável, subtelas | E2E navegação; identificação do controlador e revisão jurídica pendentes |

## Interações ainda sem validação integral

Publicação/importação válida em massa, todas as alterações de catálogo, todos os caminhos de exclusão pela UI, exportação de volume muito grande sob escrita concorrente, falha real do serviço Supabase, timeout real de fornecedor de IA, Safari/Firefox, teclado virtual de aparelho físico e instalação em iOS/Android. Os tipos matching, multiseleção, passo a passo, arrastar, imagem, cenário e problema interativo permanecem fora da interface ativa.

Não existem checkout, OAuth, upload ou push apresentados como funcionais. Contas, segredos e capturas de QA ficam em .local, fora do Git.
