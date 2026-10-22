/**
 * Cabeçalho Malheiro — regressão estática de segurança.
 * node Malheiro/scripts/validar-cabecalho.mjs
 *
 * Atenção: asserções estáticas NÃO medem CLS. É necessário testar no browser.
 */
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=path=>readFile(resolve(root,path),'utf8');
const [original, candidate, quiz, home]=await Promise.all([
  file('legado/cabecalho/html-cabecalho-original.html'),
  file('homologacao/html/cabecalho-sem-fade-arriscado.html'),
  file('legado/cabecalho/quizchat-anexo-original.html'),
  file('legado/home/base-home-original.html')
]);

const marker=/<style>\s*\/\* Containers começam invisíveis \*\//;
const index=original.search(marker);
assert(index>=0, 'Bloco de animações não encontrado no cabeçalho original');
assert.equal(candidate.replace(/\r\n/g,'\n'), original.slice(0,index).trimEnd()+'\n', 'Candidato alterou mais do que o bloco de fade/blur');
const links=str=>[...str.matchAll(/<link\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(links(candidate),links(original),'URLs preconnect, fontes ou CSS mudaram');
assert.match(candidate,/padding-top:\s*85px\s*!important/,'Reserva de topo alterada sem testes');
assert.match(candidate,/#qc-drawer\[aria-hidden="true"\]/,'Regra de drawer removida');
assert.match(candidate,/#_trustvox_colt\s*\{/,'Regra Trustvox removida');
assert(!candidate.includes('opacity: 0;'),'CSS de ocultação arriscado ainda presente');
assert(!candidate.includes('filter: blur(10px);'),'Blur inicial arriscado ainda presente');

for(const key of ['qc-trigger','qc-drawer','qc-backdrop']){
  assert(quiz.includes('id="'+key+'"'),'Quiz anexo incompleto: '+key);
  assert.equal((home.match(new RegExp('id="'+key+'"','g'))||[]).length,1,'Home já deve ter um único ID '+key);
}
assert(home.includes('const WHATS_NUMBER'),'Home não contém inicialização do QuizChat');
console.log('PASS: nenhuma URL de CSS/fontes foi alterada no cabeçalho.');
console.log('PASS: removido exclusivamente o bloco de fade/blur dependente de classes.');
console.log('PASS: QuizChat já está incorporado na home e não deve ser duplicado.');
console.log('AVISO: ainda não há validação de CLS real nem de CSS compactado externo.');
