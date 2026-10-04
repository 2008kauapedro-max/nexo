import { AuthForm } from '@/components/auth-form';
export default function Reset() { return <section className="auth-card"><span className="eyebrow">RECUPERE SEU ACESSO</span><h1>Vamos recomeçar.</h1><p>Enviaremos um link para você criar uma nova senha.</p><AuthForm mode="reset"/></section>; }
