import {writeFileSync} from 'node:fs';
import {pedagogyContent} from './pedagogy-content.mjs';
import {content} from './original-question-content.mjs';
const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
const originals=content.flatMap(s=>s[3]);
let sql='-- Add stored pedagogy to exact original question fingerprints only. Never overwrite editorial edits.\n';
for(const p of pedagogyContent){
 const original=originals.find(q=>q[1]===p.statement);
 if(!original||p.option_explanations.length!==original[2].length||p.hint.length<10||!p.solution_steps.length)throw Error('INVALID_PEDAGOGY');
 const fields=['hint','key_concept','solution_steps','option_explanations','common_mistakes','prerequisites','skills'];
 const values=fields.map(key=>Array.isArray(p[key])?quote(JSON.stringify(p[key]))+'::jsonb':quote(p[key]));
 sql+=`insert into private.question_pedagogy(question_id,${fields.join(',')}) select id,${values.join(',')} from public.questions where fingerprint=md5(lower(trim(${quote(p.statement)}))) and statement=${quote(p.statement)} on conflict(question_id) do nothing;\n`;
}
writeFileSync('supabase/pedagogy-seed.sql',sql);
console.log(`Prepared ${pedagogyContent.length} original pedagogical records; no existing records are replaced.`);
