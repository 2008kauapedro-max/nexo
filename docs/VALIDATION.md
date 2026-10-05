# Registro de validação

## Checkpoint 04/10/2026

- Supabase exclusivo: `jseljonjvpkurvhwqsjh`, São Paulo. Oito migrations aplicadas.
- Vercel exclusivo: `prj_XHclFqaz6goZrIasKoKgwZvnPO42`; variáveis públicas do Supabase, URL canônica e billing desativado configurados.
- Domínio: https://nexo-six-beta.vercel.app. A expansão deste checkpoint ainda precisa do novo deploy e validação remota.
- Site URL e callbacks de confirmação/recuperação configurados no Supabase NEXO. Confirmação de e-mail mantida, senha mínima 10 caracteres e troca segura habilitadas.
- Lint, TypeScript e 25 testes de domínio/banco passaram após AI Router.
- Suíte E2E anterior: 17/18; saída após exportação falhou na navegação durante alterações do servidor dev. Reexecução isolada do fluxo integral passou. A suíte integral precisa ser repetida sem alterações concorrentes antes da aprovação final.
- Viewports executados: 360×800, 375×812, 390×844, 393×852, 412×915, 430×932, 768×1024, 1366×768, 1440×900, 1920×1080.
- Build passou antes das últimas adições de relatórios administrativos e AI Router; será repetido.

## Advisors

Security: funções SECURITY DEFINER intencionalmente expostas apenas a authenticated, com autoria/role verificadas internamente. Cenários de autorização são testados. Não silenciar avisos transformando essas funções em acesso direto às tabelas privadas. Proteção contra senhas vazadas indisponível no plano Free (painel exige Pro); nenhum upgrade realizado.

Performance: somente índices ainda sem uso registrados pelo advisor; preservados por cobrirem chaves estrangeiras e consultas em uma base nova. Nenhum índice de FK ausente no último resultado.

## Pendências externas confirmadas pelo responsável

SMTP próprio e provedor real de IA indisponíveis. Não reutilizar qualquer segredo de outro projeto. Não considerar entrega real de e-mail ou qualidade pedagógica de respostas IA validada. Billing comercial não configurado. Textos legais precisam de responsável, contato e revisão antes de abertura pública.

## Limites desta versão

42 questões autorais, 7 lições e 14 microatividades constituem um catálogo inicial, não cobertura curricular completa. Esquema prevê 13 tipos de atividade; interface ativa usa múltipla escolha, verdadeiro/falso, numérico e completar texto. Outros tipos ainda não estão liberados. Métricas financeiras não inventam receita, margem ou MRR. Ausência de custos registrados não significa custo zero.

Nem toda combinação de erro, browser ou dispositivo físico foi testada. Consulte INTERACTION_MAP.md para separar implementação de evidência.
