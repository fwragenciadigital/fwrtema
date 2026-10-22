/** Build sem npm/dependências: HTML das seções -> JS estático e snippets de instalação. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFile(resolve(root, name), 'utf8');
const write = async (name, content) => {
  const file = resolve(root, name);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content, 'utf8');
};

const sourceHtml = await read('src/components/beneficios.html');
const sourceJs = await read('src/runtime.js');
const css = await read('assets/malheiro.css');
const settings = await read('configuracao.html');

// Proteções simples: templates são markup estático, sem scripts, event handlers ou imagens sem dimensões.
if (/<script\b|<style\b|\son[a-z]+\s*=|javascript\s*:/i.test(sourceHtml)) {
  throw new Error('HTML de componentes não pode conter script, style, eventos inline ou javascript:');
}
for (const img of sourceHtml.match(/<img\b[^>]*>/gi) || []) {
  if (!/\bwidth\s*=/.test(img) || !/\bheight\s*=/.test(img)) {
    throw new Error('Toda imagem precisa ter width e height para ajudar a evitar CLS.');
  }
}
if (!sourceJs.includes('/*__TB_TEMPLATES__*/')) {
  throw new Error('Marcador de templates ausente do runtime.');
}
// Escapa '<' para não permitir fechamento de script via HTML incorporado.
const compiledTemplates = JSON.stringify({ beneficios: sourceHtml }).replace(/</g, '\\u003c');
const js = sourceJs.replace('/*__TB_TEMPLATES__*/', compiledTemplates);
const base = 'https://fwragenciadigital.github.io/fwrtema/Malheiro';

const developmentHeader = `<!-- Malheiro - desenvolvimento: HTML/Cabeçalho, Tipo HTML -->\n<link rel="stylesheet" href="${base}/assets/malheiro.css">\n`;
const developmentFooter = `<!-- Malheiro - desenvolvimento: HTML/Rodapé, Tipo HTML -->\n${settings}\n<script defer src="${base}/assets/malheiro.js"></script>\n`;
const productionHeader = `<!-- Malheiro - produção: HTML/Cabeçalho, Tipo HTML (sem dependência do GitHub) -->\n<style>\n${css}</style>\n`;
const productionFooter = `<!-- Malheiro - produção: HTML/Rodapé, Tipo HTML (sem dependência do GitHub) -->\n${settings}\n<script>\n${js}\n</script>\n`;

await write('assets/malheiro.js', js);
await write('dist/desenvolvimento-cabecalho.html', developmentHeader);
await write('dist/desenvolvimento-rodape.html', developmentFooter);
await write('dist/producao-cabecalho.html', productionHeader);
await write('dist/producao-rodape.html', productionFooter);
console.log('Malheiro: JS e 4 snippets gerados.');
