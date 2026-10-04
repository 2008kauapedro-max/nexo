import Link from 'next/link';
import { requireProfile } from '@/lib/supabase';
import { Logo } from '@/components/logo';
import { Navigation } from '@/components/navigation';
import { logout } from '@/app/actions/auth';
export const metadata={robots:{index:false,follow:false}};
export default async function AppLayout({children}:{children:React.ReactNode}){const {profile}=await requireProfile();return <div className="app-shell"><aside className="sidebar"><Logo/><Navigation/><div className="sidebar-footer"><p>Um pouco melhor.<br/>Todos os dias.</p><Link href="/planos">Conheça os planos ↗</Link><form action={logout}><button className="button small secondary" style={{marginTop:16}}>Sair da conta</button></form></div></aside><header className="mobile-header"><Logo/><Link href="/perfil" className="avatar" aria-label="Abrir perfil">{profile.name.charAt(0).toUpperCase()}</Link></header><main id="main" className="app-main page-enter">{children}</main><Navigation mobile/></div>;}
