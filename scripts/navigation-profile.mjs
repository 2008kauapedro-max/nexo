import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const base=process.env.PERF_BASE_URL || 'https://nexo-six-beta.vercel.app';
if(!['https://nexo-six-beta.vercel.app','http://localhost:3000'].includes(base)) throw Error('NEXO only');
const account=JSON.parse(readFileSync('.local/qa-users.json','utf8'))[1];
const browser=await chromium.launch(); const samples=[];
try {
 for(const width of [1440,360,390,412]) {
  const context=await browser.newContext({viewport:{width,height:width===360?800:width===412?915:844},locale:'pt-BR'});
  const page=await context.newPage();const cdp=await context.newCDPSession(page);
  if(width<500){await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:100,downloadThroughput:200000,uploadThroughput:100000});}
  await page.addInitScript(()=>{window.__longTasks=[];new PerformanceObserver(list=>{window.__longTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})));}).observe({type:'longtask',buffered:true});});
  await page.goto(base+'/entrar');
  await page.locator('input[name=email]').fill(account.email);await page.locator('input[name=password]').fill(account.password);
  await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.waitForURL('**/inicio');await page.locator('h1').waitFor();
  const requests=[];const starts=new WeakMap();
  page.on('request',request=>starts.set(request,Date.now()));
  page.on('requestfinished',request=>{const time=starts.get(request);if(time){const h=request.headers();requests.push({path:new URL(request.url()).pathname,start:time,duration:Date.now()-time,type:request.resourceType(),prefetch:!!(h['next-router-prefetch']||h['next-router-segment-prefetch'])});}});
  for(let round=0;round<3;round++) {
   const start=Date.now();const mark=await page.evaluate(()=>performance.now());
   await page.locator('nav:visible a[href="/estudar"]').first().click();
   await page.getByRole('heading',{name:'O que vamos aprender?',exact:true}).waitFor();
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const contentMs=Date.now()-start;
   await page.waitForLoadState('networkidle');
   const settledMs=Date.now()-start;
   samples.push({width,round,contentVisibleMs:contentMs,networkSettledMs:settledMs,longTasks:await page.evaluate(mark=>window.__longTasks.filter(t=>t.start>=mark),mark),requests:requests.filter(r=>r.start>=start).map(r=>({...r,start:r.start-start}))});
   await page.locator('nav:visible a[href="/inicio"]').first().click();await page.waitForURL('**/inicio');await page.locator('h1').waitFor();
  }
  await context.close();
 }
} finally {await browser.close();}
mkdirSync('.local/evidence',{recursive:true});
writeFileSync(`.local/evidence/navigation-${process.env.PERF_LABEL||'baseline'}.json`,JSON.stringify({base,at:new Date().toISOString(),note:'Lab: click call to target heading + 2 frames. Separate network idle includes speculative prefetch. Mobile 4x CPU, 100ms RTT, 1.6Mbps. Three samples, no field INP claim.',samples},null,2));
console.log(JSON.stringify(samples.map(({requests,longTasks,...sample})=>({...sample,requests:requests.length,prefetches:requests.filter(r=>r.prefetch).length,maxLongTask:Math.max(0,...longTasks.map(t=>t.duration))})),null,2));
