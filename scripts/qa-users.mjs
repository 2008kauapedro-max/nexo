import{randomUUID,randomBytes}from'node:crypto';import{mkdirSync,writeFileSync}from'node:fs';
const users=['alice','bob','admin'].map(name=>({id:randomUUID(),email:`nexo-qa-${name}-${Date.now()}@example.com`,password:randomBytes(24).toString('base64url'),name}));
mkdirSync('.local',{recursive:true});writeFileSync('.local/qa-users.json',JSON.stringify(users));
let sql='';for(const u of users)sql+=`insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token) values('00000000-0000-0000-0000-000000000000','${u.id}','authenticated','authenticated','${u.email}',crypt('${u.password}',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','');\ninsert into auth.identities(id,user_id,provider_id,identity_data,provider,created_at,updated_at) values(gen_random_uuid(),'${u.id}','${u.id}','{"sub":"${u.id}","email":"${u.email}","email_verified":true}','email',now(),now());\n`;
sql+=`insert into private.admins(user_id) values('${users[2].id}');`;
writeFileSync('.local/qa-users.sql',sql);
process.stdout.write('Prepared three isolated QA accounts. Credentials kept in ignored .local folder.\n');
