import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=x=>readFile(resolve(root,x),'utf8');
const [compact,compactTest,head,headSticky,settings]=await Promise.all([
 read('legado/css/csscompactadoo-original.css'),
 read('homologacao/experimentos/csscompactadoo-owl-reserva-fluxo.css'),
 read('homologacao/html/cabecalho-sem-fade-arriscado.html'),
 read('homologacao/experimentos/cabecalho-sticky-sem-salto.html'),
 read('legado/configuracao/settings-tema-sanitizadas.js')
]);
const marker='.produtos-carrossel {\n    display: none;';
assert.equal(compact.split(marker).length,2,'Seletor .produtos-carrossel display:none deve ser único');
assert.equal(compactTest,compact.replace(marker,'.produtos-carrossel {\n    display: block;'),
  'Experimento Owl não pode modificar qualquer outra regra');
const urls=s=>[...s.matchAll(/(?:https?:)?\/\/cdn\.awsli\.com\.br\/[^\s"'<>)}\\]+/gi)].map(x=>x[0]);
assert.deepEqual(urls(compactTest),urls(compact),'URL AWS de imagem foi alterada');
assert.equal(urls(compact).length,30,'A contagem de referências AWS mudou; revisar a origem');
assert(compact.includes('.owl-loaded {\n    display: block;'),'Owl CSS original esperado ausente');
assert(compact.includes('margin-top: -60px;') && compact.includes('#cabecalho.fixed'),'Risco tablet mudou');
assert(compact.includes('padding-top: 124px;'),'Reserva mobile mudou');
assert(compact.includes('min-height: 85px;'),'Cabeçalho CSS alterado');
assert(headSticky.startsWith(head),'Experimento sticky reescreveu o cabeçalho');
assert(headSticky.includes('position: sticky !important') &&
  headSticky.includes('padding-top: 0 !important'),'Sticky-flow sem regras efetivas');
const headLinks=s=>[...s.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(headLinks(headSticky),headLinks(head),'URLs CSS/fontes do cabeçalho foram mudadas');
assert(/var\s+menuFlutuante\s*=\s*true\b/.test(settings),'Não é o tema atual de menuFlutuante=true');
assert(/var\s+id_token\s*=\s*''/.test(settings),'Token deve permanecer redigido');
console.log('PASS: 30 URLs AWS CSS compactado preservadas');
console.log('PASS: experimento de vitrine altera apenas o display:none inicial (NÃO pronto para deploy)');
console.log('PASS: sticky desktop é adicionado sem reescrever o cabeçalho nem alterar seus links');
console.log('PASS: regras tablet/mobile do CSS original foram preservadas');
console.log('ATENÇÃO: nenhum teste estático comprova CLS corrigido na loja real');
