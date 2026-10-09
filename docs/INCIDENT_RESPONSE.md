# Resposta a incidentes — NEXO

Escopo exclusivo: Supabase `jseljonjvpkurvhwqsjh`, Vercel NEXO e repositório `2008kauapedro-max/nexo`. Não operar recursos de outro produto mesmo que compartilhem organização.

## Primeiros passos

1. Registrar horário UTC, versão/deployment, categoria do evento e impacto conhecido. Preservar logs com acesso restrito. Não copiar tokens, cookies, senhas, textos privados ou dados de pagamento para tickets.
2. Conter a operação afetada: desativar temporariamente o recurso, bloquear o emissor quando confirmado e limitar tráfego proporcionalmente. Evitar apagar evidências ou contas como primeira medida.
3. Revogar o segredo/credencial comprometido no emissor, criar substituto, atualizar somente ambientes necessários do NEXO e fazer novo deploy. Remover um valor do Git não o torna seguro: tratar histórico, forks, artefatos de CI e caches como expostos.
4. Revisar ações durante toda a janela de exposição. Aplicar correção testada, verificar recuperação e documentar o ocorrido. Decisões de notificação e prazos legais precisam do responsável pelo produto e orientação adequada.

## Cenários

| Incidente | Contenção e verificação |
| --- | --- |
| Supabase secret/service_role exposto | Revogar/rotacionar a chave do NEXO; revisar gravações administrativas, billing e acesso a dados. Chave privilegiada ignora RLS: investigar além das policies. Atualizar env server-only e inspecionar bundle/histórico sem reproduzir o segredo. |
| Conta admin comprometida | Retirar o papel em private.admins por operador confiável, revogar sessões no Auth, trocar senha/fatores e revisar audit_logs. Revogação de refresh tokens não garante invalidação imediata de todo JWT já emitido; verificar janela de expiração e gates ativos. |
| Segredo de webhook exposto | Desativar processamento comercial, rotacionar no gateway e na Vercel, revisar IDs/hashes e conciliar eventos com o gateway. Nunca aprovar assinatura só por evento enviado pelo browser. Atualmente billing real está desativado. |
| Chave IA exposta | Revogar no provedor, desativar tutor enquanto atualiza env, revisar uso/custos e limites. Não registrar prompts privados indiscriminadamente para investigar. |
| SMTP exposto | Revogar no provedor e atualizar Auth NEXO; revisar envio, remetentes e abuso. Revalidar confirmação e recuperação. |
| Dependência crítica | Avaliar versão realmente utilizada em runtime, alcance e exploração; aplicar patch compatível e testes, reconstruir e publicar. Não executar downgrade/upgrade destrutivo sugerido automaticamente sem avaliação. |

## Recuperação e backups

No plano gratuito, manter exportação periódica externa e criptografada por operador autorizado, com retenção e acesso mínimos. Migrations preservam estrutura, não os dados dos usuários. A documentação oficial recomenda exports via CLI no Free; backups gerenciados/PITR dependem de condições/plano e não foram contratados nesta rodada. [Supabase backups](https://supabase.com/docs/guides/platform/backups).

Antes do lançamento amplo: definir responsável, frequência, RPO/RTO e destino seguro; testar restauração em ambiente explicitamente autorizado e isolado, validar constraints/RLS/contagens e procedimento de retorno. Objetos Storage exigem estratégia própria. Nenhum restore, dump de dados pessoais ou criação de projeto paralelo foi executado apenas para preencher esta documentação.

## Detecção e limites atuais

Logs `nexo_security` contêm ID aleatório, evento e horário; não recebem payload ou identidade pessoal. Agrupar rejeições de autenticação, reautenticação, CAPTCHA e eventos de API; correlacionar com logs da Vercel e Auth. Configurar alerta externo com janela/limiar baseado em tráfego legítimo antes de operação ampla. Integração de alertas e exercício de resposta ainda pendentes; ter logs não significa ter monitoramento validado.
