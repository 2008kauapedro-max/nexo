import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
const git=(args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64*1024*1024});
const rules=[
  ['private-key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['github-token',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['supabase-secret',/\bsb_secret_[A-Za-z0-9_-]{20,}\b/],
  ['provider-secret',/\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{30,}|sk_live_[A-Za-z0-9]{20,}|gsk_[A-Za-z0-9]{30,})\b/],
  ['aws-access-key',/\bAKIA[0-9A-Z]{16}\b/],
];
const findings=[];
function inspect(text,source){
  for(const [rule,pattern]of rules)if(pattern.test(text)) findings.push({source,rule});
  for(const token of text.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
    try {if(JSON.parse(Buffer.from(token[0].split('.')[1],'base64url')).role==='service_role')findings.push({source,rule:'service-role-jwt'});}catch{}
  }
}
const files=git(['ls-files','-z']).split('\0').filter(Boolean);
for(const file of files){if(existsSync(file))inspect(readFileSync(file,'utf8'),file);}
// Inspect every reachable historical blob, not just current files. Never print matching values.
const objects=git(['rev-list','--objects','--all']).trim().split('\n').filter(Boolean);
let blobs=0;
for(const object of objects){
  const space=object.indexOf(' ');if(space<0)continue;
  const oid=object.slice(0,space);
  if(git(['cat-file','-t',oid]).trim()!=='blob')continue;
  blobs++;
  inspect(git(['cat-file','blob',oid]),`history:${oid}:${object.slice(space+1)}`);
}
const trackedPrivateEnv=files.filter(p=>/(^|\/)\.env(?:\.|$)/.test(p)&&!p.endsWith('.example'));
for(const source of trackedPrivateEnv)findings.push({source,rule:'tracked-private-env'});
if(existsSync('.env.local')) {
  const env=readFileSync('.env.local','utf8');
  for(const line of env.split(/\r?\n/))if(line.startsWith('NEXT_PUBLIC_')) {
    const [name,...value]=line.split('=');
    if(/SECRET|PASSWORD|PRIVATE|SERVICE_ROLE|WEBHOOK/.test(name)) findings.push({source:'.env.local:'+name,rule:'private-name-public-env'});
    inspect(value.join('='),'.env.local:'+name);
  }
}
const report={at:new Date().toISOString(),trackedFiles:files.length,historicalBlobs:blobs,findings,note:'Pattern-based scan. No matching value is logged. A clean result is not proof that every possible secret is absent.'};
mkdirSync('.local/evidence',{recursive:true});
writeFileSync('.local/evidence/secrets-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(findings.length)process.exitCode=1;
