/**
 * Validação estática avançada dos candidatos de CLS.
 * Executar: node Malheiro/scripts/validar-cls-v2.mjs
 * NÃO substitui medição CrUX/Chrome da loja.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>readFile(resolve(root,p),'utf8');
const files=[
 'legado/cabecalho/html-cabecalho-original.html',
 'homologacao/html/cabecalho-sem-fade-arriscado.html',
 'homologacao/html/cabecalho-prepaint-desktop.html',
 'legado/css/css-secundario-original.css',
 'homologacao/assets/css-secundario-sem-padding-duplicado.css',
 'legado/cdn/malheiroshoww-estabilizado-original.js',
 'homologacao/assets/malheiroshoww.js',
 'homologacao/experimentos/malheiroshoww-owl-domready.js',
 'legado/home/base-home-original.html',
 'homologacao/html/home.html'
];
const [head0,head1,head2,css0,css1,js0,js1,js2,home0,home1] = await Promise.all(files.map(read));
const linkURLs=s=>[...s.matchAll(/<link\b[^>]*href="([^"]+)"/gi)].map(m=>m[1]);
const awsURLs=s=>[...s.matchAll(/(?:https?:)?\/\/cdn\.awsli\.com\.br\/[^\s"'<>)}\\]+/g)].map(m=>m[0]);
const images=s=>[...s.matchAll(/(?:src|data-bg|data-product-img)\s*=\s*["']((?:https?:)?\/\/cdn\.awsli\.com\.br\/[^"']+)["']/gi)].map(m=>m[1]);
const fade=/<style>\s*\/\* Containers começam invisíveis \*\//;
const fadeIndex=head0.search(fade);
assert(fadeIndex>=0,'Bloco fade não encontrado');
assert.equal(head1.replace(/\r\n/g,'\n'),head0.slice(0,fadeIndex).replace(/\r\n/g,'\n').trimEnd()+'\n','Remoção do fade modificou código adicional');
assert(head2.startsWith(head1),'Header prepaint deve acrescentar código, nunca reescrever estilos existentes');
assert(head2.includes('document.documentElement.classList.add') && head2.includes('position: fixed !important'),'Prepaint ausente');
assert.deepEqual(linkURLs(head0),linkURLs(head2),'CSS/fontes externos do head alterados');
assert.deepEqual(awsURLs(head0),awsURLs(head2),'AWS do head alterada');
const cssRule='    body {\n        padding-top: 72px!important;\n    }\n';
assert.equal(css0.split(cssRule).length,2,'Regra do padding redundante mudou ou duplicou');
assert.equal(css1,css0.replace(cssRule,'    /* Reserva do topo agora é responsabilidade do HTML/Cabeçalho (85px em desktop). */\n'),'CSS alterado fora da remoção planejada');
assert.deepEqual(awsURLs(css0),awsURLs(css1),'URLs imagens CDN CSS alteradas');
const owlAnchor='$(window).on("load",function(){$(".listagem .produtos-carrossel").owlCarousel(';
const owlNew='$(document).ready(function(){$(".listagem .produtos-carrossel").owlCarousel(';
assert.equal(js1.split(owlAnchor).length,3,'JS candidato deveria ter duas inicializações window.load');
assert.equal(js2,js1.replaceAll(owlAnchor,owlNew),'Owl experiment modificou código adicional');
assert.deepEqual(awsURLs(js0),awsURLs(js1),'URLs CDN JS original x candidato');
assert.deepEqual(awsURLs(js1),awsURLs(js2),'URLs CDN JS candidato x Owl');
new Script(js0.replace(/^\uFEFF/,''));
new Script(js1.replace(/^\uFEFF/,''));
new Script(js2.replace(/^\uFEFF/,''));
assert.deepEqual(images(home0),images(home1),'URLs CDN de imagens na home alteradas');
assert(!head2.includes('opacity: 0;'),'Produtos potencialmente invisíveis no head');
console.log('PASS: CSS de cabeçalho tem prepaint opcional e só remove bloco fade dependente de classes');
console.log('PASS: CSS secundário só perdeu o padding-top de 72px redundante');
console.log('PASS: JS base/candidato/Owl têm sintaxe válida e preservam URLs CDN');
console.log('PASS: arquivos de home mantêm URLs de imagens');
console.log('AVISO: este teste não prova CLS da loja; precisa Chrome Performance e QA funcional');
