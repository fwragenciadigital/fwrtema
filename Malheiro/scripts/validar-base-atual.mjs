import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const candidate = process.argv.includes('--candidate');
const header = process.argv.includes('--header');
const control = process.argv.includes('--control');
const screenshotsOnly = process.argv.includes('--screenshots');
const runs = Number(process.env.RUNS || 5);
const widths = (process.env.WIDTHS || '390,820,1366').split(',').map(Number);
const out = resolve('Malheiro/auditoria/evidencias-base-atual', header ? 'header' : control ? 'control' : candidate ? 'candidate' : 'published');
await mkdir(out, { recursive: true });
const local = await readFile('Malheiro/homologacao/assets/home-malheiro-ablation-cls.js', 'utf8');
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const results = [];
try {
  for (const width of widths) for (let run = 1; run <= runs; run++) {
    const ctx = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [];
    let replaced = false, asset;
    page.on('pageerror', e => errors.push(e.message.slice(0, 220)));
    page.on('response', async response => {
      if (/\/[^/]*home-malheiro[^/]*\.js(?:\?|$)/.test(response.url())) {
        const body = await response.text().catch(() => '');
        asset = { url: response.url(), status: response.status(), sha256: createHash('sha256').update(body).digest('hex'), benefitsFlex: body.includes('__FWR_BENEFITS_FLEX__'), instagram: body.includes('insta-footer') };
      }
    });
    if (candidate) await page.route(/\/[^/]*home-malheiro[^/]*\.js(?:\?|$)/, async route => {
      replaced = true;
      await route.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8', body: local });
    });
    if (header || control) await page.route('https://www.farmaciamalheiro.com.br/', async route => {
      const response = await route.fetch();
      const html = await response.text();
      const css = await readFile('Malheiro/homologacao/experimentos/header-fixed-reprovado.html', 'utf8');
      await route.fulfill({ response, body: header ? html.replace('</head>', css + '</head>') : html });
    });
    await page.addInitScript(() => {
      const sel = node => { const el = node?.nodeType === 1 ? node : node?.parentElement; return el ? el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + [...el.classList].slice(0, 3).map(c => '.' + c).join('') : null; };
      const data = window.__baseAudit = { shifts: [], geometry: [], lcp: null };
      new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) data.shifts.push({ t: e.startTime, value: e.value, sources: e.sources.map(s => ({ selector: sel(s.node), previous: s.previousRect.toJSON(), current: s.currentRect.toJSON() })) }); }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(list => { for (const e of list.getEntries()) data.lcp = { t: e.startTime, selector: sel(e.element), url: e.url }; }).observe({ type: 'largest-contentful-paint', buffered: true });
      let last = '', end = performance.now() + 12000;
      function frame() {
        const h = document.querySelector('#cabecalho'), main = document.querySelector('.conteiner-principal'), list = document.querySelector('#corpo #listagemProdutos');
        const v = { headerPosition: h && getComputedStyle(h).position, headerHeight: h?.getBoundingClientRect().height, mainTop: main?.getBoundingClientRect().top, bodyPadding: document.body && getComputedStyle(document.body).paddingTop, listHeight: list?.getBoundingClientRect().height, owl: !!document.querySelector('.owl-loaded'), base: !!document.querySelector('#fm-categorias') };
        const key = JSON.stringify(v);
        if (key !== last) { data.geometry.push({ t: performance.now(), ...v }); last = key; }
        if (performance.now() < end) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    let status, failure;
    try {
      status = (await page.goto('https://www.farmaciamalheiro.com.br/', { waitUntil: 'domcontentloaded', timeout: 45000 })).status();
      await page.waitForTimeout(10000);
    } catch (e) { failure = e.message.slice(0, 200); }
    const data = await page.evaluate(() => ({ ...window.__baseAudit, state: window.__FWR_MALHEIRO_HOME_ASSET_V1__, duplicateQuiz: document.querySelectorAll('#qc-trigger').length, rawCodeText: document.body.innerText.includes('(function()'), visibleProducts: [...document.querySelectorAll('.listagem-item')].filter(e => getComputedStyle(e).opacity !== '0' && e.getBoundingClientRect().height > 0).length, qc: !!document.querySelector('#qc-trigger'), categories: !!document.querySelector('#fm-categorias') }));
    if (run === 1) await page.screenshot({ path: resolve(out, `home-${width}.png`) });
    if (screenshotsOnly) { await ctx.close(); continue; }
    if (run === 1) {
      try {
      await page.locator('#qc-trigger').first().click({ timeout: 3000 });
      data.quizOpens = await page.locator('#qc-drawer').first().evaluate(el => !el.hidden && el.getAttribute('aria-hidden') === 'false');
      await page.locator('#qc-close').first().click();
      await page.locator('#qc-drawer').first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
      data.quizCloses = !(await page.locator('#qc-drawer').first().isVisible());
      await page.locator('#qc-backdrop').first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
      data.quizBackdropCloses = !(await page.locator('#qc-backdrop').first().isVisible());
      } catch (e) { data.quizError = e.message.split('\n')[0]; }
      if (header) {
        await page.evaluate(() => window.scrollTo(0, 600));
        data.headerAfterScroll = await page.locator('#cabecalho').evaluate(el => ({ top: el.getBoundingClientRect().top, position: getComputedStyle(el).position }));
        data.cartPresent = await page.locator('#cabecalho a[href="/carrinho/index"]').count() > 0;
        await page.evaluate(() => window.scrollTo(0, 0));
      }
    }
    let cls = 0, sum = 0, start = 0, last = 0;
    for (const e of data.shifts) { if (e.t - last >= 1000 || e.t - start >= 5000) { sum = 0; start = e.t; } sum += e.value; last = e.t; cls = Math.max(cls, sum); }
    const row = { width, run, candidate, header, replaced, status, failure, cls, asset, errors, ...data };
    results.push(row);
    await writeFile(resolve(out, 'results.json'), JSON.stringify({ date: new Date().toISOString(), mode: 'fresh incognito contexts; no network/CPU throttling; cold cache; 10s after DOMContentLoaded; lab NOT CrUX', results }, null, 2));
    console.log(JSON.stringify({ width, run, cls, lcp: data.lcp?.t, status, errors, replaced }));
    await ctx.close();
  }
} finally { await browser.close(); }
