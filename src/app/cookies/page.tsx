import { Legal } from "@/components/legal";
export default function Cookies() {
  return (
    <Legal title="Cookies essenciais.">
      <p>
        O NEXO utiliza cookies de autenticação para manter sua sessão e permitir
        o acesso às páginas da sua conta. São enviados apenas nas conexões
        necessárias ao funcionamento do serviço.
      </p>
      <h2>Controle</h2>
      <p>
        Ao sair da conta, a sessão é encerrada. Você também pode remover os
        cookies nas configurações do navegador; será necessário entrar
        novamente.
      </p>
      <h2>Sem publicidade comportamental</h2>
      <p>
        Esta versão não instala cookies de publicidade ou de análise de
        terceiros. Se novas finalidades forem adicionadas, esta página e os
        controles de consentimento deverão ser atualizados.
      </p>
      <h2>Modo offline</h2>
      <p>
        A página de indisponibilidade pode ficar no cache do navegador.
        Respostas, credenciais e dados privados de estudo não são guardados
        nesse cache.
      </p>
    </Legal>
  );
}
