import { Logo } from '@/components/logo';
export default function AuthLayout({children}:{children:React.ReactNode}) { return <div className="auth-shell"><header className="wrap public-header"><Logo/></header><main id="main" className="auth-main">{children}</main><footer className="auth-footer">Um passo de cada vez. No seu ritmo.</footer></div>; }
