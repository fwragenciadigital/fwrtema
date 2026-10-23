/**
 * Valida em Chromium local a variante experimental sem Trustvox/modal de vídeo.
 * Uso: node Malheiro/scripts/validar-ablation-cls.mjs
 * CHROME_PATH pode apontar para o Chrome instalado se o Chromium do Playwright
 * não estiver disponível.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assetPath = resolve(root, 'homologacao/assets/home-malheiro-ablation-cls.js');
const asset = await readFile(assetPath, 'utf8');
const browserPath = process.env.CHROME_PATH;
const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox'],
  ...(browserPath && existsSync(browserPath) ? { executablePath: browserPath } : {})
});

try {
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  await page.route('**/*', async route => {
    if (route.request().resourceType() === 'script') {
      await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
      return;
    }
    await route.continue();
  });
  await page.setContent(`<!doctype html><html><head></head><body>
    <main id="corpo"><ul id="listagemProdutos" class="listagem borda-alpha"><li>vitrine nativa</li></ul></main>
    <div class="titulo_avalia">Avaliações</div><div id="_trustvox_colt"></div>
  </body></html>`);
  await page.addScriptTag({ path: assetPath });
  await page.waitForFunction(() => window.__FWR_MALHEIRO_HOME_ASSET_V1__?.state === 'mounted', null, { timeout: 30000 });

  const afterMount = await page.evaluate(() => ({
    state: window.__FWR_MALHEIRO_HOME_ASSET_V1__.state,
    trustvoxCount: document.querySelectorAll('.titulo_avalia, #_trustvox_colt').length,
    modalCount: document.querySelectorAll('.fwr-vc-modal, .fwr-vc-modal__panel, .fwr-vc-modal__backdrop').length,
    quizchatCount: document.querySelectorAll('#qc-trigger').length,
    showcaseNext: document.querySelector('#listagemProdutos')?.nextElementSibling?.id || '',
    videosCount: document.querySelectorAll('.videos-box').length
  }));

  assert.equal(afterMount.state, 'mounted');
  assert.equal(afterMount.trustvoxCount, 0, 'Trustvox inicial deveria ter sido removido');
  assert.equal(afterMount.modalCount, 0, 'modal/backdrop de vídeo não deve estar no DOM');
  assert.equal(afterMount.quizchatCount, 1, 'QuizChat deve continuar presente');
  assert.equal(afterMount.showcaseNext, 'fm-categorias', 'base deve continuar após a vitrine nativa');
  assert.equal(afterMount.videosCount, 1, 'bloco visual de vídeos permanece, sem o player modal');

  await page.evaluate(() => {
    const late = document.createElement('div');
    late.innerHTML = '<div class="titulo_avalia">Avaliações tardias</div><div id="_trustvox_colt"></div>';
    document.body.appendChild(late);
  });
  await page.waitForFunction(() => document.querySelectorAll('.titulo_avalia, #_trustvox_colt').length === 0, null, { timeout: 3000 });
  console.log('PASS: Chromium montou a variante, removeu Trustvox inicial/tardio e manteve QuizChat, vídeos e ordem da vitrine.');
  console.log(JSON.stringify(afterMount));
} finally {
  await browser.close();
}
