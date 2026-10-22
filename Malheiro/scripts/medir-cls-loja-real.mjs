/**
 * Malheiro CLS Live: comparação somente leitura em Chromium.
 * Intercepta o HTML e o JS SOMENTE dentro da sessão isolada do navegador.
 * Não altera o conteúdo da Loja Integrada ou os arquivos do CDN público.
 *
 * Executar na raiz após instalar playwright e chromium:
 * node Malheiro/scripts/medir-cls-loja-real.mjs
 */
import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const storefront='https://www.farmaciamalheiro.com.br/';
const jsCandidate=await readFile(resolve(root,'homologacao/assets/malheiroshoww.js'),'utf8');
const UA='Malheiro-CLS-Validation/1.0';
const result=[];
const collector=String.raw`
(()=> {
  window.__malheiroClsEvents=[];
  try {
    const observer=new PerformanceObserver(list=>{
      for(const e of list.getEntries()){
        if(e.hadRecentInput) continue;
        window.__malheiroClsEvents.push({
          t:Math.round(e.startTime),value:e.value,
          sources:(e.sources||[]).slice(0,4).map(s=>({
            selector:s.node?.tagName?.toLowerCase() + (s.node?.id ? '#'+s.node.id : ''),
            oldY:s.previousRect?.y, newY:s.currentRect?.y
          }))
        });
      }
    });
    observer.observe({type:'layout-shift',buffered:true});
  }catch(e){window.__malheiroObserverError=String(e);}
})();`;

const prepaint=`<script>document.documentElement.classList.add('ml-header-prepaint-test');</script>
<style>@media(min-width:993px){
html.ml-header-prepaint-test body:not(.pagina-carrinho):not(.carrinho-checkout) #cabecalho {
  position:fixed!important;top:0;left:0;right:0;width:100%;z-index:201;
}
html.ml-header-prepaint-test body:not(.pagina-carrinho):not(.carrinho-checkout) {
  padding-top:85px!important;
}
}</style>`;

function clsLargestWindow(events){
  let best=0;
  const ordered=[...events].sort((a,b)=>a.t-b.t);
  for(let i=0;i<ordered.length;i++){
    let start=ordered[i].t,last=start,sum=ordered[i].value;
    for(let j=i+1;j<ordered.length;j++){
      if(ordered[j].t-last>1000||ordered[j].t-start>5000) break;
      sum+=ordered[j].value;last=ordered[j].t;
    }
    best=Math.max(best,sum);
  }
  return +best.toFixed(6);
}
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
for(const {w,h} of [{w:1366,h:768},{w:390,h:844}]){
  for(const variant of ['original','header-prepaint']){
    const ctx=await browser.newContext({
      viewport:{width:w,height:h},deviceScaleFactor:1,
      reducedMotion:'reduce'
    });
    const page=await ctx.newPage();
    const row={viewport:`${w}x${h}`,variant,htmlModified:false,jsReplaced:false,
      documentStatus:null,cls:null,events:[],errors:[]};
    await page.addInitScript({content:collector});
    page.on('pageerror',e=>row.errors.push('pageerror: '+e.message.slice(0,220)));
    const candidate=variant==='header-prepaint';
    if(candidate){
      await page.route('**/malheiroshoww-estabilizado.js**',async route=>{
        row.jsReplaced=true;
        await route.fulfill({status:200,contentType:'application/javascript; charset=utf-8',body:jsCandidate});
      });
      await page.route('**/*',async route=>{
        if(route.request().resourceType()!=='document')return route.continue();
        const response=await route.fetch({timeout:45000});
        let body=await response.text();
        if(!/<\/head\s*>/i.test(body)) throw new Error('HTML retornado sem fechamento de head');
        body=body.replace(/<\/head\s*>/i,prepaint+'</head>');
        row.htmlModified=true;
        await route.fulfill({response,body});
      });
    }
    try{
      const response=await page.goto(storefront,{waitUntil:'domcontentloaded',timeout:60000});
      row.documentStatus=response?.status()??null;
      await page.waitForTimeout(4000);
      row.events=await page.evaluate(()=>window.__malheiroClsEvents||[]);
      row.cls=clsLargestWindow(row.events);
      row.geometry=await page.evaluate(()=>{
        const h=document.querySelector('#cabecalho');
        const b=document.body;
        const main=document.querySelector('.conteiner-principal');
        return {
          headerPosition:h?getComputedStyle(h).position:null,
          headerHeight:h?.getBoundingClientRect().height??null,
          bodyPaddingTop:b?getComputedStyle(b).paddingTop:null,
          contentTop:main?.getBoundingClientRect().top??null,
          hasOwl:!!document.querySelector('.listagem .owl-loaded')
        };
      });
      if(row.documentStatus!==200)row.errors.push('HTTP da loja: '+row.documentStatus);
    } catch(e) { row.errors.push(String(e).slice(0,500)); }
    result.push(row);
    console.log(JSON.stringify({viewport:row.viewport,variant:row.variant,CLS:row.cls,HTTP:row.documentStatus,headerPosition:row.geometry?.headerPosition,jsReplaced:row.jsReplaced,errors:row.errors.slice(0,2)}));
    await ctx.close();
  }
}
await browser.close();
const out=resolve(root,'auditoria/cls-live-browser-resultados.json');
await mkdir(dirname(out),{recursive:true});
await writeFile(out,JSON.stringify({date:new Date().toISOString(),source:'real storefront via Chromium GitHub Actions; single lab runs; NOT CrUX',site:storefront,results:result},null,2));
console.log('Resultado de execução: '+out);
if(result.every(r=>r.documentStatus!==200))process.exitCode=1;
