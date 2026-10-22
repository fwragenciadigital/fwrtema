import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const rd=x=>readFile(resolve(root,x),'utf8');
const [before,after,settings]=await Promise.all([
 rd('homologacao/html/home.html'),
 rd('homologacao/experimentos/home-montagem-sincrona.html'),
 rd('legado/configuracao/settings-tema-sanitizadas.js')
]);
const cdnRefs=s=>[...s.matchAll(/(?:src|data-bg|data-product-img)\s*=\s*["']((?:https?:)?\/\/cdn\.awsli\.com\.br\/[^"']+)["']/gi)].map(m=>m[1]);
assert.deepEqual(cdnRefs(before),cdnRefs(after),'URLs e ordem dos assets alteradas');
assert.match(settings,/\bvar\s+menuFlutuante\s*=\s*true\b/,'Menu flutuante não confirmado');
assert.match(settings,/\bvar\s+id_token\s*=\s*''/,'A variável de token precisa permanecer redigida');
assert(!/id_token\s*=\s*['"][^'"]{15,}['"]/.test(settings),'Token privado inserido no GitHub');
assert.equal((before.match(/\.lista-one'\)\.insertAfter\('#corpo'\)/g)||[]).length,1,'Mover tardio não identificado');
assert(!after.includes("$('.lista-one').insertAfter('#corpo')"),'Ainda aguarda o jQuery ready');
assert(after.includes("alvo.insertAdjacentElement('afterend', bloco)"),'Montagem síncrona ausente');
assert(after.includes('if (!posicionarCategorias())'),'Categorias não são tentadas síncronamente');
assert.equal((after.match(/function posicionarCategorias\(\)/g)||[]).length,1,'Posicionadores duplicados');
console.log('PASS: menuFlutuante ativo no snapshot de Settings sanitizado.');
console.log('PASS: nenhuma URL AWS da home mudou ('+cdnRefs(before).length+' referências).');
console.log('PASS: lista-one e categorias tentam posição ao interpretar HTML.');
console.log('AVISO: sincronização no rodapé não garante pintura inicial; validar Layout Shifts na loja.');
