import { requireUser } from '@/lib/supabase';
import { OnboardingForm } from '@/components/onboarding-form';
import { Logo } from '@/components/logo';
import { redirect } from 'next/navigation';
export default async function Onboarding(){ const {db,user}=await requireUser(); const [{data:subjects,error},{data:profile}]=await Promise.all([db.from('subjects').select('*').order('position'),db.from('profiles').select('*').eq('id',user.id).single()]); if(profile?.onboarding_complete) redirect('/inicio'); if(error) throw error; return <><header className="public-header wrap"><Logo/></header><main id="main" className="wrap"><section className="onboarding"><span className="eyebrow">UM CAMINHO SÓ SEU</span><h1>O que você quer alcançar?</h1><p>Conte um pouco sobre você. O resto, a gente descobre no caminho.</p><OnboardingForm subjects={subjects||[]}/></section></main></>; }
