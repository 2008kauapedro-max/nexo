# Internacionalização e desempenho — checkpoint de 6 de outubro de 2026

Trabalho em andamento. Este checkpoint não declara o produto completamente traduzido nem uma melhora de desempenho em produção.

## Validado

- next-intl 4.14.9; dez catálogos: pt-BR, en-US, es, fr, de, it, ja, ko, zh-CN e ru. Fallback estrutural pt-BR.
- Preferência da conta prevalece sobre cookie do visitante; detecção Accept-Language respeita prioridades. Rotas existentes são preservadas.
- Login, cadastro, recuperação, onboarding, navegação, landing, loading e erros centrais usam chaves semânticas. Conteúdo educacional continua no idioma original.
- E2E: troca mantém e-mail digitado; refresh mantém idioma; logout/login recupera preferência da conta; dez idiomas sem overflow no login a 360 e 1440 px.
- Banco: preferência própria editável; perfil de outro usuário e XP continuam inacessíveis. Fuso IANA validado no banco. Preferência de fuso ainda precisa ser integrada à contagem diária de estudos.
- Admin: busca e paginação no banco, dez questões por página, permissão editorial validada antes de retornar respostas.
- Questões: origem da tradução e status de revisão; constraint impede publicação de tradução não revisada. Fluxo editorial completo de tradução e identificação do revisor ainda pendentes.
- Formatação regional: helpers e testes para datas completas, datas de calendário sem deslocamento indevido, números e moeda independente do idioma. Integração nas telas ainda em andamento.
- Tutor recebe idioma da conta e permite pedido explícito de outro idioma. Sem credenciais: nenhuma resposta real validada.
- Lint, tipos, 39 testes unitários/de banco e build passaram neste checkpoint. Cinco E2E direcionados (editorial e i18n) passaram antes das últimas alterações de landing/formatação; suíte completa ainda precisa ser repetida ao final.

## Desempenho: evidência e limites

Produção de referência: bb8f14c. Medição inicial incluía estabilização de rede e mostrou 3985 ms para a primeira navegação móvel para Estudar, com tarefas de até 432 ms. Isso não deve ser apresentado como INP.

Medição refinada no mesmo deployment, em 6 de outubro, separa chegada do título da tela (mais dois frames) da rede. Na primeira passagem: 445 ms em 1440 px, 1250 ms em 360 px, 3095 ms em 390 px, 927 ms em 412 px. Repetições: 287–566 ms. Celulares simulados com CPU 4x, RTT 100 ms e 1,6 Mbps; amostras pequenas sujeitas à carga do computador. Na primeira passagem móvel houve 18 requisições de prefetch e tarefas de até 441 ms. Ainda não há comparação válida com a versão final modificada.

Correções já presentes no código: sincronização/contagem de notificações deduplicadas por render e em Suspense; loading dentro do layout; exportação ordenada corretamente, filtrada explicitamente pelo usuário e com no máximo quatro consultas simultâneas; paginação editorial no servidor.

## Continuação obrigatória

Completar as telas internas e mensagens de ações, classificando os candidatos de `scripts/audit-i18n.mjs`; localizar notificações por tipo/parâmetros; integrar datas e fusos; revisar texto longo/CJK; verificar preservação de resposta de sessão e campos de onboarding; medir e corrigir prefetch/main thread; ampliar E2E; advisors; build final; deploy exclusivo NEXO; logs e auditoria no deployment real.

SMTP próprio e provedor real de IA continuam pendências externas. Entrega real de e-mail e resposta real do tutor não foram validadas.

## Compatibilidade local

O pacote @swc/core 1.16.13 introduziu carrier nativo incompatível com as permissões do cache Windows deste ambiente. O override 1.16.0 permanece dentro da faixa exigida pelo next-intl e iniciou os testes/build corretamente, sem alterar permissões do Windows. Reavaliar esse override quando a incompatibilidade for corrigida upstream.
