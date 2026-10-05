import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
const base='https://nexo-six-beta.vercel.app';
const browser=await chromium.launch({headless:true});
try {
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto(base);
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.reload();
  assert.ok(await page.evaluate(()=>!!navigator.serviceWorker.controller),'Service worker should control the page');
  const cached=await page.evaluate(async()=>{const names=await caches.keys();return Promise.all(names.filter(name=>name.startsWith('nexo-offline-')).map(async name=>(await(await caches.open(name)).keys()).map(req=>new URL(req.url).pathname)));});
  assert.deepEqual(cached,[['/offline.html']],'No private pages should be cached');
  const manifest=await(await page.request.get(base+'/manifest.webmanifest')).json();
  assert.equal(manifest.name,'NEXO');assert.equal(manifest.start_url,'/inicio');
  await context.setOffline(true);
  await page.goto(base+'/inicio');
  await page.getByRole('heading',{name:'Uma pausa na conexão.'}).waitFor();
  mkdirSync('.local/evidence',{recursive:true});
  await page.screenshot({path:'.local/evidence/offline-production.png',caret:'initial'});
  await context.setOffline(false);
  await page.getByRole('link',{name:'Tentar novamente'}).click();
  await page.waitForURL(/entrar$/);
  console.log('PASS: production manifest, service worker, public-only cache, offline fallback and reconnection to authenticated entry.');
} finally {await browser.close();}
