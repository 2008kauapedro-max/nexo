import{test,expect,type Page}from'@playwright/test';
import{readFileSync,existsSync}from'node:fs';
const users: {email:string;password:string}[]=existsSync('.local/qa-users.json')?JSON.parse(readFileSync('.local/qa-users.json','utf8')):[];
async function login(page:Page,index=0){await page.goto('/entrar');await page.getByLabel('E-mail',{exact:true}).fill(users[index].email);await page.getByLabel('Senha',{exact:true}).fill(users[index].password);await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page).toHaveURL(/\/inicio$/);}
test('public routes, navigation, invalid login, protected routes and callback',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('Seu ritmo');await page.getByRole('link',{name:'Começar gratuitamente',exact:true}).click();await expect(page).toHaveURL(/cadastro/);await expect(page.getByRole('button',{name:'Criar minha conta'})).toBeVisible();
 await page.goto('/inicio');await expect(page).toHaveURL(/entrar/);await page.getByLabel('E-mail',{exact:true}).fill('invalid@example.com');await page.getByLabel('Senha',{exact:true}).fill('invalid-password-123');await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Não foi possível entrar');
 await page.goto('/auth/callback?next=//evil.example');await expect(page).toHaveURL(/entrar\?erro=callback/);await expect(page.getByRole('alert')).toContainText('link pode ter expirado');
 await page.goto('/esqueci-senha');await expect(page.getByRole('button',{name:'Enviar link de recuperação'})).toBeVisible();await page.goto('/inexistente');await expect(page.getByRole('heading')).toContainText('Este caminho ainda não existe');
});
const sizes=[[360,800],[375,812],[390,844],[393,852],[412,915],[430,932],[768,1024],[1366,768],[1440,900],[1920,1080]];
for(const[width,height]of sizes)test(`responsive ${width}x${height}: public and authenticated routes`,async({page})=>{
 await page.setViewportSize({width,height});
 for(const route of ['/','/entrar','/cadastro']){await page.goto(route);await expect(page.locator('h1')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
 await page.screenshot({path:`test-results/landing-${width}.png`,fullPage:true});
 if(users.length){await login(page);for(const route of ['/inicio','/estudar','/estudar/matematica','/simulados','/ia','/perfil','/planos','/diagnostico']){await page.goto(route);await expect(page.locator('h1')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
 await page.goto('/inicio');await page.screenshot({path:`test-results/home-${width}.png`,fullPage:true});}
});
test('real study flow, feedback, result, AI unavailable, export and logout',async({page})=>{
 test.skip(!users.length,'Requires isolated Supabase QA credentials.');await page.setViewportSize({width:390,height:844});await login(page);await page.goto('/estudar/matematica');await page.getByRole('button',{name:'Treino rápido →'}).click();await expect(page).toHaveURL(/sessao/);
 for(let i=0;i<5;i++){await expect(page.locator('.answer').first()).toBeVisible();await page.locator('.answer').first().click();await page.getByRole('button',{name:'Confirmar resposta'}).click();await expect(page.locator('.feedback')).toBeVisible();await page.getByRole('button',{name:i===4?'Ver resultado':'Próxima questão',exact:true}).click();}
 await expect(page).toHaveURL(/resultado/);await expect(page.getByRole('heading',{name:'Você avançou.'})).toBeVisible();await page.screenshot({path:'test-results/result-mobile.png',fullPage:true});
 await page.goto('/ia');await page.getByRole('button',{name:'Me dê uma dica',exact:true}).click();await expect(page.getByRole('alert')).toContainText('ainda está sendo conectado');
 await page.goto('/perfil');const download=page.waitForEvent('download');await page.getByRole('link',{name:'Baixar meus dados'}).click();expect((await download).suggestedFilename()).toBe('meus-dados-nexo.json');await page.getByRole('button',{name:'Sair da conta'}).filter({visible:true}).click();await expect(page).toHaveURL(/entrar/);
});
test('simulation limit, ordinary user admin denial and actual admin access',async({page})=>{
 test.skip(!users.length,'Requires isolated QA credentials.');await login(page,1);await page.goto('/simulados');await page.getByLabel('Quantidade de questões').selectOption('90');await page.getByRole('button',{name:'Iniciar simulado →'}).click();await expect(page.getByRole('alert')).toContainText('até 10 questões');await page.goto('/admin');await expect(page.getByRole('heading')).toContainText('Este caminho ainda não existe');
 await page.context().clearCookies();await login(page,2);await page.goto('/admin');await expect(page.getByRole('heading',{name:'Qualidade começa no conteúdo.'})).toBeVisible();await page.getByLabel('Lista de questões').fill('[{}]');await page.getByRole('button',{name:'Validar e importar'}).click();await expect(page.getByRole('alert')).toContainText('Linha 1');
});
