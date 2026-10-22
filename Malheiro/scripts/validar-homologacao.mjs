/**
 * Testes estáticos obrigatórios para a candidata Malheiro.
 * node Malheiro/scripts/validar-homologacao.mjs
 * NÃO mede CLS real: requer Chrome Performance + Loja Integrada.
 */
import {readFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const rd=(p)=>readFile(resolve(root,p),'utf8');
const [js0,js1,html0,html1,css0,css1]=await Promise.all([
  rd('legado/cdn/malheiroshoww-estabilizado-original.js'),
  rd('homologacao/assets/malheiroshoww.js'),
  rd('legado/home/base-home-original.html'),
  rd('homologacao/html/home.html'),
  rd('legado/css/css-secundario-original.css'),
  rd('homologacao/assets/css-secundario.css')
]);
const token='$(".'+'secao-banners").prepend($(".banner.cheio"))';
const first=js0.indexOf(token), second=js0.indexOf(token,first+token.length);
assert(first>=0 && second>first,'Duas chamadas idênticas de reposicionamento esperadas');
const expected=js0.slice(0,second)+'void 0'+js0.slice(second+token.length);
assert.equal(js1,expected,'JS de homologação alterou mais que a chamada duplicada');
new Script(js1.replace(/^\uFEFF/,''));
assert.equal(css1,css0,'CSS original deve continuar byte-for-byte textual idêntico');
const cdn=(s)=>[...s.matchAll(/(?:src|data-bg|data-product-img)\s*=\s*["']((?:https?:)?\/\/cdn\.awsli\.com\.br\/[^"']+)["']/gi)].map(x=>x[1]);
assert.deepEqual(cdn(html1),cdn(html0),'URLs CDN da home mudaram');
assert.equal((html1.match(/function posicionarCategorias\(\)/g)||[]).length,1);
assert.equal((html1.match(/function posicionar\(\)/g)||[]).length,0);
assert(!html1.includes('window.__FWR_VC_HARDENED__'),'Handler JS solto ainda presente');
assert(!html1.includes('window.__FWR_BENEFITS_FLEX__'),'Handler JS solto ainda presente');
assert(html1.includes('class="fwr-vc-modal"'),'Modal deve continuar existente');
console.log('PASS: JS isolado e sintaticamente válido, uma única movimentação duplicada removida.');
console.log('PASS: CSS de homologação idêntico ao CSS original.');
console.log('PASS: '+cdn(html0).length+' URLs de recursos CDN da home preservadas literalmente.');
console.log('PASS: posicionador de categorias único; blocos JS órfãos removidos.');
console.log('AVISO: ainda é necessária validação visual e CLS no navegador.');
