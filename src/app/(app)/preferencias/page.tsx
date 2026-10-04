import {requireProfile} from '@/lib/supabase';
import {OnboardingForm} from '@/components/onboarding-form';
export default async function Preferences(){const{db,profile}=await requireProfile();const{data,error}=await db.from('subjects').select('*').order('position');if(error)throw error;return <section className="onboarding"><span className="eyebrow">SEU CAMINHO PODE MUDAR</span><h1>Suas preferências.</h1><p>Atualize seus objetivos e selecione suas matérias.</p><OnboardingForm subjects={data||[]} name={profile.name}/></section>;}
