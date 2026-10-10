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

## Groq contextual

Destino exclusivo: projeto Vercel NEXO → Settings → Environment Variables.

Configurar `GROQ_API_KEY` e `SUPABASE_SECRET_KEY` do NEXO, ambas somente no servidor. A chave Supabase permite reservar/finalizar cotas em RPCs exclusivas de service_role. Não usar a chave pública nessa função. Nenhuma chave do FIO pode ser reutilizada. Endpoint e modelo já estão definidos no código: `https://api.groq.com/openai/v1`, exclusivamente `openai/gpt-oss-20b`. Não são necessárias AI_BASE_URL nem AI_MODEL. Depois de provisionada a credencial interna do NEXO, a única credencial externa da IA é GROQ_API_KEY.

Não há fallback para outro modelo, Browser Search ou Code Execution. A abstração de provider permanece, mas a configuração ativa admite só Groq/20b. Timeout de 18 segundos, 900 tokens de saída, 300 caracteres de observação, uma questão por pedido. Sem chaves, a API informa indisponibilidade e não consome cota. Dicas, conceitos, soluções, alternativas e estudo continuam disponíveis. Mocks existem somente nos testes. Cotas diárias 5/20/50 e proteção de concorrência/burst são verificadas no banco; reserva com falha é devolvida ou expira em dois minutos.

Após salvar, criar novo deployment. Testar respostas reais, dica sem gabarito, prompt injection, recusa educacional, contexto de outro usuário, cota, indisponibilidade, latência e uso real. A política educacional do prompt requer avaliação com o modelo real; não é barreira infalível. Métricas administrativas registram status, tokens, latência e custo estimado quando o provider fornece o uso: US$ 0,075/milhão de tokens de entrada e US$ 0,30/milhão de saída, conforme [modelo Groq](https://console.groq.com/docs/model/openai/gpt-oss-20b). Estimativa não substitui a fatura. Ainda não há resposta real validada sem credenciais.

## Cobrança

Permanece desativada em produção. Existe contrato de webhook assinado restrito a desenvolvimento, com HMAC, janela de tempo, deduplicação e ordenação de eventos. Isso não equivale a integrar um gateway comercial. Checkout, estornos, conciliação e eventos reais de assinatura precisam de provedor e testes próprios antes da liberação.

