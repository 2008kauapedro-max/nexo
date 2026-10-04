import Link from 'next/link';
export default function NotFound(){return <main id="main" className="empty-state"><span className="eyebrow">404</span><h1>Este caminho ainda não existe.</h1><Link className="button primary" href="/inicio">Voltar ao início</Link></main>;}
