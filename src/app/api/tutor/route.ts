import {z} from 'zod';
import {createClient} from '@supabase/supabase-js';
import {supabase} from '@/lib/supabase';
import {CompatibleTutor} from '@/lib/ai';
import {brand} from '@/config/brand';
import type {Database} from '@/lib/database.types';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(brand.url).origin)return Response.json({error:'Origem inválida.'},{status:403});
 if(Number(request.headers.get('content-length')||0)>12000)return Response.json({error:'Mensagem muito longa.'},{status:413});
 const raw=await request.text();if(raw.length>12000)return Response.json({error:'Mensagem muito longa.'},{status:413});
 let body:unknown;try{body=JSON.parse(raw);}catch{return Response.json({error:'Mensagem inválida.'},{status:400});}
 const parsed=z.object({prompt:z.string().trim().min(3).max(1500),question:z.uuid().optional(),session:z.uuid().optional()}).safeParse(body);
 if(!parsed.success)return Response.json({error:'Confira sua mensagem.'},{status:400});
 const db=await supabase();const{data:{user}}=await db.auth.getUser();if(!user)return Response.json({error:'Entre na sua conta.'},{status:401});
 if(!process.env.AI_API_KEY||!process.env.AI_MODEL||!process.env.SUPABASE_SECRET_KEY)return Response.json({error:'O Professor NEXO ainda está sendo conectado. As explicações das questões continuam disponíveis após cada resposta.'},{status:503});
 let context:unknown={};if(parsed.data.question&&parsed.data.session){const{data,error}=await db.rpc('ai_context',{p_question:parsed.data.question,p_session:parsed.data.session});if(error)return Response.json({error:'Contexto indisponível.'},{status:403});context=data;}
 const{data:usage,error}=await db.rpc('reserve_ai');if(error||!usage)return Response.json({error:'Limite de interações atingido ou pedidos muito próximos. Tente novamente mais tarde.'},{status:429});
 const service=createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
 try{const result=await new CompatibleTutor().explain(parsed.data.prompt,context);await service.rpc('finish_ai',{p_usage:usage,p_user:user.id,p_question:parsed.data.question!,p_prompt:parsed.data.prompt,p_answer:result.text,p_tokens:result.tokens,p_success:true});return Response.json({text:result.text});}
 catch{await service.rpc('finish_ai',{p_usage:usage,p_user:user.id,p_question:parsed.data.question!,p_prompt:parsed.data.prompt,p_answer:'',p_tokens:0,p_success:false});return Response.json({error:'O tutor não respondeu a tempo. Sua interação foi devolvida; tente novamente.'},{status:503});}
}
