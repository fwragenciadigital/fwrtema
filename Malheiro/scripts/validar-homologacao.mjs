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
assert.equal((html1.match(/window\.__FWR_HOME_ORDER__ = true/g)||[]).length,1,'Organizador deve ser idempotente e único');
assert.match(html1, /#corpo #listagemProdutos\.listagem\.borda-alpha/,'Vitrine nativa principal não está identificada');
assert.match(html1, /var blocos = \[categorias, listaUm, listaDois, videos, marcas\]/,'Ordem final dos módulos autorais mudou');
assert.match(html1, /insertBefore\(fragmento, vitrine\.nextSibling\)/,'Módulos não são montados em um único fragmento');
assert.doesNotMatch(html1, /function posicionarCategorias\(\)|function posicionar\(\)|insertAfter\('#corpo'\)|data\.fmPosicionado/,'Posicionador legado ou duplicado ainda presente');
assert(html1.includes('class="fwr-vc-modal"'),'Modal deve continuar existente');
assert(html1.includes('id="qc-trigger"') && html1.includes('id="_trustvox_colt"'),'QuizChat e Trustvox devem permanecer no HTML');
console.log('PASS: JS isolado e sintaticamente válido; montagem da home idempotente e sem posicionadores concorrentes.');
console.log('PASS: CSS de homologação idêntico ao CSS original.');
console.log('PASS: '+cdn(html0).length+' URLs de recursos CDN da home preservadas literalmente.');
console.log('PASS: vitrine nativa precede categorias, módulos autorais e faixa de marcas.');
console.log('AVISO: ainda é necessária validação visual e CLS no navegador.');
