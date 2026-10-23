import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const rd=x=>readFile(resolve(root,x),'utf8');
const [before,after,settings]=await Promise.all([
 rd('legado/home/base-home-original.html'),
 rd('homologacao/html/home.html'),
 rd('legado/configuracao/settings-tema-sanitizadas.js')
]);
const cdnRefs=s=>[...s.matchAll(/(?:src|data-bg|data-product-img)\s*=\s*["']((?:https?:)?\/\/cdn\.awsli\.com\.br\/[^"']+)["']/gi)].map(m=>m[1]);
assert.deepEqual(cdnRefs(before),cdnRefs(after),'URLs e ordem dos assets alteradas');
assert.match(settings,/\bvar\s+menuFlutuante\s*=\s*true\b/,'Menu flutuante não confirmado');
assert.match(settings,/\bvar\s+id_token\s*=\s*''/,'A variável de token precisa permanecer redigida');
assert(!/id_token\s*=\s*['"][^'"]{15,}['"]/.test(settings),'Token privado inserido no GitHub');
assert.equal((before.match(/\.lista-one'\)\.insertAfter\('#corpo'\)/g)||[]).length,1,'Baseline legado mudou; atualizar teste explicitamente');
assert(!after.includes("$('.lista-one').insertAfter('#corpo')"),'Reposicionamento jQuery legado ainda presente');
assert.match(after, /#corpo #listagemProdutos\.listagem\.borda-alpha/,'Vitrine nativa principal não identificada');
assert.match(after, /var blocos = \[categorias, listaUm, listaDois, videos, marcas\]/,'Ordem de montagem incompleta');
assert.match(after, /var fragmento = document\.createDocumentFragment\(\)/,'Montagem em fragmento ausente');
assert.match(after, /insertBefore\(fragmento, vitrine\.nextSibling\)/,'Não monta após a vitrine nativa');
assert.doesNotMatch(after, /function posicionarCategorias\(\)|function posicionar\(\)|insertAfter\('#corpo'\)|data\.fmPosicionado/,'Reposicionadores concorrentes ainda presentes');
console.log('PASS: menuFlutuante ativo no snapshot de Settings sanitizado.');
console.log('PASS: nenhuma URL AWS da home mudou ('+cdnRefs(before).length+' referências).');
console.log('PASS: módulos da base são organizados uma vez após a vitrine nativa principal.');
console.log('AVISO: o arquivo não garante posição antes da pintura se for injetado após o HTML da página; validar Layout Shifts na loja de teste.');
