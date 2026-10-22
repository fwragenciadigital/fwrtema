import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = name => readFile(new URL(name, import.meta.url), 'utf8');

test('final não depende do GitHub ou de buscar HTML externo', async () => {
  const header = await read('./dist/producao-cabecalho.html');
  const footer = await read('./dist/producao-rodape.html');
  assert.match(header, /<style>/);
  assert.match(footer, /window\.MalheiroSettings/);
  assert.match(footer, /malheiro-beneficios/);
  assert.doesNotMatch(header + footer, /github\.io|<script[^>]*src=|<link[^>]*href=|\bfetch\(/);
});

test('desenvolvimento aponta para arquivos publicados estáticos', async () => {
  const header = await read('./dist/desenvolvimento-cabecalho.html');
  const footer = await read('./dist/desenvolvimento-rodape.html');
  assert.match(header, /malheiro\.css/);
  assert.match(footer, /malheiro\.js/);
  assert.match(footer, /malheiroAtivo = false/);
});

test('runtime não depende de biblioteca e contém verificações de idempotência', async () => {
  const js = await read('./assets/malheiro.js');
  assert.match(js, /\.initialized/);
  assert.match(js, /replaceChildren/);
  assert.doesNotMatch(js, /jQuery|\$\(/);
});

test('base da home preserva uma vitrine nativa inicial e ordena os módulos uma vez', async () => {
  const home = await read('./homologacao/html/home.html');
  assert.match(home, /#corpo #listagemProdutos\.listagem\.borda-alpha/);
  assert.match(home, /var blocos = \[categorias, listaUm, listaDois, videos, marcas\]/);
  assert.match(home, /insertBefore\(fragmento, vitrine\.nextSibling\)/);
  assert.doesNotMatch(home, /posicionarCategorias|insertAfter\('#corpo'\)|data\.fmPosicionado/);
  for (const marker of ['.lista-one', '.lista-two', '.videos-box', '.banner-central-marcas', 'id="qc-trigger"', 'id="_trustvox_colt"']) {
    assert.ok(home.includes(marker), `base perdeu integração ou bloco: ${marker}`);
  }
});
