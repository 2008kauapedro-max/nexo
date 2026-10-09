# Ativação dos serviços externos

## CAPTCHA (preparado, ainda não ativado)

Criar widget Turnstile para os domínios reais do NEXO. Salvar apenas a site key pública em `NEXT_PUBLIC_TURNSTILE_SITE_KEY` na Vercel NEXO. A secret key fica na configuração CAPTCHA do Supabase NEXO, com o provider Turnstile habilitado. O servidor encaminha o token para Supabase Auth nos fluxos de login, cadastro, recuperação e reautenticação para exclusão; é o Auth que valida o desafio. Um widget isolado não protege a API Auth direta. Não validar o mesmo token duas vezes em serviços diferentes.

A CSP permite somente o domínio específico do desafio quando há site key. Sem configuração, nenhum script Turnstile é carregado e não se afirma proteção anti-bot ativa. Após ativar: token ausente, inválido, expirado e repetido devem falhar no Auth direto; teste também envio legítimo e recuperação neutra. Nunca usar chaves de teste em produção. [Configuração oficial](https://supabase.com/docs/guides/auth/auth-captcha).

## E-mail

Destino exclusivo: Supabase NEXO `jseljonjvpkurvhwqsjh` → Authentication → Emails → SMTP Settings.

Será necessário um serviço SMTP transacional próprio e um remetente em domínio autorizado. Informar host, porta TLS recomendada pelo fornecedor (normalmente 465 ou 587), usuário, senha/token e endereço do remetente. Configurar SPF, DKIM e DMARC no domínio conforme o fornecedor. Não colocar credenciais SMTP no frontend ou no Git.

Site URL: `https://nexo-six-beta.vercel.app`. Redirect URLs já configuradas: `/auth/callback` e `/auth/callback?next=/redefinir-senha` nesse domínio. Não usar um wildcard de todos os projetos Vercel. Mudanças de domínio exigem atualizar essa lista e NEXT_PUBLIC_APP_URL.

Templates em `supabase/templates`: confirmação, recuperação e convite, com `{{ .ConfirmationURL }}` preservado. O painel atual só permite customizar templates após SMTP próprio. Os arquivos estão preparados para aplicar então; não se afirma que estão ativos remotamente. Em Supabase local, o capturador de e-mails permite testar sem entregar mensagens externas.

Confirmação de e-mail permanece habilitada remotamente. Não desativá-la para contornar ausência de SMTP. O remetente padrão de desenvolvimento é limitado e não valida envio público. Antes de liberar: testar nova conta com caixa de entrada controlada, link único/expirado, troca de dispositivo, recuperação, nova senha, revogação e limites. Nenhuma entrega real foi confirmada nesta rodada.

## IA compatível e fallback

Destino exclusivo: projeto Vercel NEXO → Settings → Environment Variables.

Configurar `AI_BASE_URL` (HTTPS do endpoint compatível com Chat Completions, incluindo versão), `AI_MODEL` (identificador real contratado), `AI_API_KEY` (segredo), e `SUPABASE_SECRET_KEY` do NEXO (somente servidor para finalizar consumo). Groq ou outro fornecedor compatível pode ser configurado sem alterar a interface de domínio. Nenhum fornecedor é presumido ou contratado pelo código.

Fallback opcional: `AI_FALLBACK_BASE_URL`, `AI_FALLBACK_MODEL`, `AI_FALLBACK_API_KEY`. Somente provedores completamente configurados são utilizados; a primeira falha encaminha ao segundo. Cada tentativa tem timeout de 18 segundos, limite de saída e validação do formato. Sem chave não há texto simulado: a API retorna indisponibilidade e os controles de envio ficam desativados na interface. Mocks existem apenas nos testes unitários.

Após salvar, criar novo deployment. Testar: pergunta contextual, dica sem gabarito, tentativa de prompt injection, recusa educacional, contexto de outro usuário, quota, indisponibilidade, latência, tokens e custo real. A política educacional no prompt não deve ser considerada uma barreira infalível; requer avaliação com o modelo escolhido. Custo monetário não é calculado sem tarifa confirmada. O router atualmente retorna provider/model, mas a persistência de métricas por fornecedor ainda deve ser ampliada.

## Cobrança

Permanece desativada em produção. Existe contrato de webhook assinado restrito a desenvolvimento, com HMAC, janela de tempo, deduplicação e ordenação de eventos. Isso não equivale a integrar um gateway comercial. Checkout, estornos, conciliação e eventos reais de assinatura precisam de provedor e testes próprios antes da liberação.

