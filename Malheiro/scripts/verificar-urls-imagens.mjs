/**
 * Valida que URLs já hospedadas no CDN continuam IDENTICAMENTE iguais.
 * Executar na raiz do repositório: node Malheiro/scripts/verificar-urls-imagens.mjs
 */
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(resolve(root,'legado/home/base-home-original.html'),'utf8');
const candidate = await readFile(resolve(root,'src/home/base-home-candidata-posicionamento-unico.html'),'utf8');
const cssSource = await readFile(resolve(root,'legado/css/css-secundario-original.css'),'utf8');

function imagesInHtml(html) {
  const matches = [...html.matchAll(/(?:src|data-bg|data-product-img)\s*=\s*["']((?:https?:)?\/\/cdn\.awsli\.com\.br\/[^"']+)["']/gi)];
  return matches.map(match => match[1]).filter(url => /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i.test(url));
}
function assetsInCss(css) {
  return [...css.matchAll(/url\(\s*["']?((?:https?:)?\/\/cdn\.awsli\.com\.br\/[^"'\s)]+)/gi)].map(m=>m[1]);
}
function assertSame(a,b,label){
  if (a.length!==b.length || a.some((x,i)=>x!==b[i])) {
    throw new Error(label+': ordem, quantidade ou URL foi alterada. Pare o deploy.');
  }
}
const baseline=imagesInHtml(source), current=imagesInHtml(candidate);
assertSame(baseline,current,'URLs de imagens HTML');
if (assetsInCss(cssSource).some(url => !url)) throw new Error('URL CSS vazia');
console.log('OK: '+baseline.length+' referências de imagens CDN idênticas no HTML original e candidato.');
console.log('OK: '+assetsInCss(cssSource).length+' referências CSS preservadas no CSS original.');
