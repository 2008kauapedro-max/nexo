import {notFound} from 'next/navigation';
import {z} from 'zod';
import {requireProfile} from '@/lib/supabase';
import {Admin} from '@/components/admin';
export default async function AdminPage(){const{db}=await requireProfile();const{data:admin}=await db.rpc('is_admin');if(!admin)notFound();const[{data:subjects},{data:topics},{data:questions,error}]=await Promise.all([db.from('subjects').select('*'),db.from('topics').select('*'),db.rpc('admin_questions')]);if(error)throw error;const parsed=z.array(z.object({id:z.string(),statement:z.string(),subject_id:z.string(),topic_id:z.string(),difficulty:z.number(),status:z.string(),options:z.array(z.string()),answer:z.number(),explanation:z.string()})).parse(questions);return <><div className="page-heading"><div><span className="eyebrow">ÁREA RESTRITA</span><h1>Qualidade começa no conteúdo.</h1><p>Revise, publique e organize o banco de questões.</p></div></div><Admin subjects={subjects||[]} topics={topics||[]} questions={parsed}/></>;}
